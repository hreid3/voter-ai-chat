import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Sql } from 'postgres';
import type { Sponsor, } from './types';

export class SponsorsDataImporter {
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
        const peoplePath = path.join(sessionPath, 'people');
        
        try {
            const peopleFiles = await fs.readdir(peoplePath);
            
            for (const peopleFile of peopleFiles) {
                if (!peopleFile.endsWith('.json')) continue;
                
                const filePath = path.join(peoplePath, peopleFile);
                await this.processPeopleFile(filePath, state, session);
            }
        } catch (error) {
            console.error(`Error processing session ${session} in state ${state}:`, error);
        }
    }

    private async processPeopleFile(filePath: string, state: string, session: string) {
        // Check if file has already been processed
        const processed = await this.checkProcessStatus(filePath);
        if (processed) return;

        try {
            // Update process tracker to 'processing'
            await this.updateProcessStatus(filePath, state, session, 'processing');

            const fileContent = await fs.readFile(filePath, 'utf-8');
            const personData = JSON.parse(fileContent);
            
            // Extract person object and map to Sponsor type
            const person = personData.person;
            const sponsor: Sponsor = {
                sponsorId: person.people_id,
                name: person.name,
                party: person.party,
                district: person.district,
                role: person.role
            };

            // Store sponsor in database
            await this.storeSponsor(sponsor);

            // Update process tracker to 'completed'
            await this.updateProcessStatus(filePath, state, session, 'completed');
        } catch (error) {
            console.error(`Error processing people file ${filePath}:`, error);
            await this.updateProcessStatus(filePath, state, session, 'failed');
            throw error;
        }
    }

    private async storeSponsor(sponsor: Sponsor) {
        await this.sql`
            INSERT INTO sponsors (sponsor_id, name, party, district, role)
            VALUES (${sponsor.sponsorId}, ${sponsor.name}, ${sponsor.party}, ${sponsor.district}, ${sponsor.role})
            ON CONFLICT (sponsor_id) DO UPDATE
            SET name = ${sponsor.name},
                party = ${sponsor.party},
                district = ${sponsor.district},
                role = ${sponsor.role}
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
            VALUES (${filePath}, 'people', ${state}, ${session}, ${status}, CURRENT_TIMESTAMP)
            ON CONFLICT (absolute_path) DO UPDATE
            SET status = ${status},
                updated_at = CURRENT_TIMESTAMP
        `;
    }
} 