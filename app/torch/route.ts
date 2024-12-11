import { NextResponse } from 'next/server'
// @ts-ignore
import { generateSQL } from '@/lib/ml/tourch-test';
import postgres from "postgres";
import value = postgres.toPascal.value;

// @ts-ignore
export async function GET(request) {
	const text2  = "tables:\n" + "CREATE TABLE table_22767 ( \"Year\" real, \"World\" real, \"Asia\" text, \"Africa\" text, \"Europe\" text, \"Latin America/Caribbean\" text, \"Northern America\" text, \"Oceania\" text )" + "\n" +"query for:what will the population of Asia be when Latin America/Caribbean is 783 (7.5%)?."
	const text = "tables:\n" + "CREATE TABLE Catalogs (date_of_latest_revision VARCHAR)" + "\n" +"query for: Find the dates on which more than one revisions were made." ;//request.nextUrl.searchParams.get('text');
	const text3 = `
"
tables:
CREATE TABLE public.voter_all_data (
    county_code VARCHAR,
    registration_number VARCHAR,
    voter_status VARCHAR,
    residence_city VARCHAR,
    residence_zipcode VARCHAR,
    birthyear VARCHAR,
    registration_date TIMESTAMP,
    race VARCHAR,
    gender VARCHAR,
    land_district VARCHAR,
    land_lot VARCHAR,
    status_reason VARCHAR,
    county_precinct_id VARCHAR,
    city_precinct_id VARCHAR,
    congressional_district VARCHAR,
    senate_district VARCHAR,
    house_district VARCHAR,
    judicial_district VARCHAR,
    commission_district VARCHAR,
    school_district VARCHAR,
    county_districta_name VARCHAR,
    county_districta_value VARCHAR,
    county_districtb_name VARCHAR,
    county_districtb_value VARCHAR,
    municipal_name VARCHAR,
    municipal_code VARCHAR,
    ward_city_council_name VARCHAR,
    ward_city_council_code VARCHAR,
    city_school_district_name VARCHAR,
    city_school_district_value VARCHAR,
    city_dista_name VARCHAR,
    city_dista_value VARCHAR,
    city_distb_name VARCHAR,
    city_distb_value VARCHAR,
    city_distc_name VARCHAR,
    city_distc_value VARCHAR,
    city_distd_name VARCHAR,
    city_distd_value VARCHAR,
    date_last_voted TIMESTAMP,
    party_last_voted VARCHAR,
    date_added TIMESTAMP,
    date_changed TIMESTAMP,
    district_combo VARCHAR,
    race_desc VARCHAR,
    last_contact_date TIMESTAMP)	
query for:	Mappings for columns {race: {W: "White", B: "Black" }}, how many white and blacs in zip code 30066?  
	`

	// if (!text) {
	// 	return NextResponse.json({
	// 		error: 'Missing text parameter',
	// 	}, { status: 400 });
	// }
	// Get the classification pipeline. When called for the first time,
	// this will load the pipeline and cache it for future use.
	// @ts-ignore
	// Generate SQL using the singleton pipeline
	const sql = await generateSQL(text3)
	return NextResponse.json(sql);
}
