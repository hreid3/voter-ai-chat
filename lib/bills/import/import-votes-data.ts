import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Sql } from 'postgres';
import type { RollCall, RollCallVote, } from './types';

export class RollCallDataImporter {
    private sql: Sql;

    constructor(sql: Sql) {
        this.sql = sql;
    }

    async processDirectory(rootDir: string) {
        try {
            const states = await fs.readdir(rootDir);
            
            for (const state of states) {
                const statePath = path.join(rootDir, state);
                const stats = await fs.stat(statePath);
                
                if (!stats.isDirectory()) continue;
                
                await this.processState(statePath, state);
            }
        } catch (error) {
            console.error('Error processing directory:', error);
            throw error;
        }
    }

    private async processState(statePath: string, state: string) {
        const sessions = await fs.readdir(statePath);
        
        for (const session of sessions) {
            const sessionPath = path.join(statePath, session);
            const stats = await fs.stat(sessionPath);
            
            if (!stats.isDirectory()) continue;
            
            await this.processSession(sessionPath, state, session);
        }
    }

    private async processSession(sessionPath: string, state: string, session: string) {
        const votePath = path.join(sessionPath, 'vote');
        
        try {
            const voteFiles = await fs.readdir(votePath);
            
            for (const voteFile of voteFiles) {
                if (!voteFile.endsWith('.json')) continue;
                
                const filePath = path.join(votePath, voteFile);
                await this.processVoteFile(filePath, state, session);
            }
        } catch (error) {
            console.error(`Error processing session ${session} in state ${state}:`, error);
        }
    }

    private async processVoteFile(filePath: string, state: string, session: string) {
        // Check if file has already been processed
        const processed = await this.checkProcessStatus(filePath);
        if (processed) return;

        try {
            // Update process tracker to 'processing'
            await this.updateProcessStatus(filePath, state, session, 'processing');

            const fileContent = await fs.readFile(filePath, 'utf-8');
            const jsonData = JSON.parse(fileContent);
            const rawVoteData = jsonData.roll_call;
            
            // Process main vote record
            const vote: RollCall = {
                rollCallId: rawVoteData.roll_call_id,
                billId: rawVoteData.bill_id,
                date: new Date(rawVoteData.date),
                yea: rawVoteData.yea,
                nay: rawVoteData.nay,
                nv: rawVoteData.nv,
                absent: rawVoteData.absent,
                passed: Boolean(rawVoteData.passed),
                chamber: rawVoteData.chamber,
                chamber_id: rawVoteData.chamber_id
            };

            try {
                // Store main roll call record
                await this.storeRollCall(vote);

                // Process individual roll call votes
                if (rawVoteData.votes) {
                    for (const v of rawVoteData.votes) {
                        try {
                            const rollCallVote: RollCallVote = {
                                rollCallId: vote.rollCallId,
                                sponsorId: v.people_id,
                                vote: v.vote_text
                            };
                            await this.storeRollCallVote(rollCallVote);
                        } catch (err) {
                            // Type guard for postgres error
                            if (err && typeof err === 'object' && 'code' in err) {
                                const error = err as { code: string };
                                console.error(`Error storing vote for sponsor ${v.people_id} on roll call ${vote.rollCallId}:`, error);
                                if (error.code === '23503') { // Foreign key violation
                                    console.warn(`Either sponsor ${v.people_id} or roll call ${vote.rollCallId} not found in respective tables`);
                                }
                            } else {
                                console.error(`Unknown error storing vote for sponsor ${v.people_id}:`, err);
                            }
                            // Continue processing other votes
                        }
                    }
                }

                await this.updateProcessStatus(filePath, state, session, 'completed');
            } catch (err) {
                // Type guard for postgres error
                if (err && typeof err === 'object' && 'code' in err) {
                    const error = err as { code: string };
                    console.error(`Error processing roll call file ${filePath}:`, error);
                    if (error.code === '23503') { // Foreign key violation
                        console.warn(`Bill ${vote.billId} not found in bills table`);
                    }
                } else {
                    console.error(`Unknown error processing roll call file ${filePath}:`, err);
                }
                await this.updateProcessStatus(filePath, state, session, 'failed');
                throw err;
            }
        } catch (error) {
            console.error(`Error processing vote file ${filePath}:`, error);
            await this.updateProcessStatus(filePath, state, session, 'failed');
            throw error;
        }
    }

    private async storeRollCallVote(rollCallVote: RollCallVote) {
        await this.sql`
            INSERT INTO roll_call_votes (roll_call_id, sponsor_id, vote)
            VALUES (${rollCallVote.rollCallId}, ${rollCallVote.sponsorId}, ${rollCallVote.vote})
            ON CONFLICT (roll_call_id, sponsor_id) DO UPDATE
            SET vote = ${rollCallVote.vote}
        `;
    }

    private async checkProcessStatus(filePath: string): Promise<boolean> {
        const result = await this.sql`
            SELECT status FROM process_tracker 
            WHERE absolute_path = ${filePath} AND status = 'completed'
        `;
        return result.length > 0;
    }

    private async updateProcessStatus(
        filePath: string,
        state: string,
        session: string,
        status: 'pending' | 'processing' | 'completed' | 'failed'
    ) {
        await this.sql`
            INSERT INTO process_tracker 
            (absolute_path, file_type, state, session, status, updated_at)
            VALUES (${filePath}, 'vote', ${state}, ${session}, ${status}, CURRENT_TIMESTAMP)
            ON CONFLICT (absolute_path) DO UPDATE
            SET status = ${status},
                updated_at = CURRENT_TIMESTAMP
        `;
    }

    private async storeRollCall(rollCall: RollCall) {
        await this.sql`
            INSERT INTO roll_calls (roll_call_id, bill_id, date, yea, nay, nv, absent, passed, chamber, chamber_id)
            VALUES (${rollCall.rollCallId}, ${rollCall.billId}, ${rollCall.date}, ${rollCall.yea}, ${rollCall.nay}, 
                   ${rollCall.nv}, ${rollCall.absent}, ${rollCall.passed}, ${rollCall.chamber}, ${rollCall.chamber_id})
            ON CONFLICT (roll_call_id) DO UPDATE
            SET bill_id = ${rollCall.billId},
                date = ${rollCall.date},
                yea = ${rollCall.yea},
                nay = ${rollCall.nay},
                nv = ${rollCall.nv},
                absent = ${rollCall.absent},
                passed = ${rollCall.passed},
                chamber = ${rollCall.chamber},
                chamber_id = ${rollCall.chamber_id}
        `;
    }
} 