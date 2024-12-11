import { NextResponse } from 'next/server'
// @ts-ignore
import Text2SqlPipelineSingleton from '@/lib/ml/test2sql';
import postgres from "postgres";
import value = postgres.toPascal.value;

// @ts-ignore
export async function GET(request) {
	const text2  = "tables:\n" + "CREATE TABLE table_22767 ( \"Year\" real, \"World\" real, \"Asia\" text, \"Africa\" text, \"Europe\" text, \"Latin America/Caribbean\" text, \"Northern America\" text, \"Oceania\" text )" + "\n" +"query for:what will the population of Asia be when Latin America/Caribbean is 783 (7.5%)?."
	const text = "tables:\n" + "CREATE TABLE Catalogs (date_of_latest_revision VARCHAR)" + "\n" +"query for: Find the dates on which more than one revisions were made." ;//request.nextUrl.searchParams.get('text');
	// if (!text) {
	// 	return NextResponse.json({
	// 		error: 'Missing text parameter',
	// 	}, { status: 400 });
	// }
	// Get the classification pipeline. When called for the first time,
	// this will load the pipeline and cache it for future use.
	// @ts-ignore
	const result = ''

	return NextResponse.json(result);
}
