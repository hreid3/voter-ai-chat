export const voter_status_change_data_ddl =
    `
     "CREATE TABLE voterdata.voter_status_change_data (
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
    last_contact_date TIMESTAMP
);

COMMENT ON TABLE voterdata.voter_status_change_data IS 'Summary of voter status change data';

COMMENT ON COLUMN voterdata.voter_status_change_data.county_code IS 'County code';
COMMENT ON COLUMN voterdata.voter_status_change_data.registration_number IS 'Registration number';
COMMENT ON COLUMN voterdata.voter_status_change_data.voter_status IS 'Voter status';
COMMENT ON COLUMN voterdata.voter_status_change_data.residence_city IS 'Residence city';
COMMENT ON COLUMN voterdata.voter_status_change_data.residence_zipcode IS 'Residence zipcode';
COMMENT ON COLUMN voterdata.voter_status_change_data.birthyear IS 'Birth year';
COMMENT ON COLUMN voterdata.voter_status_change_data.registration_date IS 'Registration date';
COMMENT ON COLUMN voterdata.voter_status_change_data.race IS 'Race';
COMMENT ON COLUMN voterdata.voter_status_change_data.gender IS 'Gender';
COMMENT ON COLUMN voterdata.voter_status_change_data.land_district IS 'Land district';
COMMENT ON COLUMN voterdata.voter_status_change_data.land_lot IS 'Land lot';
COMMENT ON COLUMN voterdata.voter_status_change_data.status_reason IS 'Status reason';
COMMENT ON COLUMN voterdata.voter_status_change_data.county_precinct_id IS 'County precinct ID';
COMMENT ON COLUMN voterdata.voter_status_change_data.city_precinct_id IS 'City precinct ID';
COMMENT ON COLUMN voterdata.voter_status_change_data.congressional_district IS 'Congressional district';
COMMENT ON COLUMN voterdata.voter_status_change_data.senate_district IS 'Senate district';
COMMENT ON COLUMN voterdata.voter_status_change_data.house_district IS 'House district';
COMMENT ON COLUMN voterdata.voter_status_change_data.judicial_district IS 'Judicial district';
COMMENT ON COLUMN voterdata.voter_status_change_data.commission_district IS 'Commission district';
COMMENT ON COLUMN voterdata.voter_status_change_data.school_district IS 'School district';
COMMENT ON COLUMN voterdata.voter_status_change_data.county_districta_name IS 'County district A name';
COMMENT ON COLUMN voterdata.voter_status_change_data.county_districta_value IS 'County district A value';
COMMENT ON COLUMN voterdata.voter_status_change_data.county_districtb_name IS 'County district B name';
COMMENT ON COLUMN voterdata.voter_status_change_data.county_districtb_value IS 'County district B value';
COMMENT ON COLUMN voterdata.voter_status_change_data.municipal_name IS 'Municipal name';
COMMENT ON COLUMN voterdata.voter_status_change_data.municipal_code IS 'Municipal code';
COMMENT ON COLUMN voterdata.voter_status_change_data.ward_city_council_name IS 'Ward city council name';
COMMENT ON COLUMN voterdata.voter_status_change_data.ward_city_council_code IS 'Ward city council code';
COMMENT ON COLUMN voterdata.voter_status_change_data.city_school_district_name IS 'City school district name';
COMMENT ON COLUMN voterdata.voter_status_change_data.city_school_district_value IS 'City school district value';
COMMENT ON COLUMN voterdata.voter_status_change_data.city_dista_name IS 'City district A name';
COMMENT ON COLUMN voterdata.voter_status_change_data.city_dista_value IS 'City district A value';
COMMENT ON COLUMN voterdata.voter_status_change_data.city_distb_name IS 'City district B name';
COMMENT ON COLUMN voterdata.voter_status_change_data.city_distb_value IS 'City district B value';
COMMENT ON COLUMN voterdata.voter_status_change_data.city_distc_name IS 'City district C name';
COMMENT ON COLUMN voterdata.voter_status_change_data.city_distc_value IS 'City district C value';
COMMENT ON COLUMN voterdata.voter_status_change_data.city_distd_name IS 'City district D name';
COMMENT ON COLUMN voterdata.voter_status_change_data.city_distd_value IS 'City district D value';
COMMENT ON COLUMN voterdata.voter_status_change_data.date_last_voted IS 'Date last voted';
COMMENT ON COLUMN voterdata.voter_status_change_data.party_last_voted IS 'Party last voted';
COMMENT ON COLUMN voterdata.voter_status_change_data.date_added IS 'Date added';
COMMENT ON COLUMN voterdata.voter_status_change_data.date_changed IS 'Date changed';
COMMENT ON COLUMN voterdata.voter_status_change_data.district_combo IS 'District combo';
COMMENT ON COLUMN voterdata.voter_status_change_data.race_desc IS 'Race description';
COMMENT ON COLUMN voterdata.voter_status_change_data.last_contact_date IS 'Last contact date';
"   
    `

export const returnedRowsTestData =
    `
 "county_code","registration_number","voter_status","residence_city","residence_zipcode","birthyear","registration_date","race","gender","land_district","land_lot","status_reason","county_precinct_id","city_precinct_id","congressional_district","senate_district","house_district","judicial_district","commission_district","school_district","county_districta_name","county_districta_value","county_districtb_name","county_districtb_value","municipal_name","municipal_code","ward_city_council_name","ward_city_council_code","city_school_district_name","city_school_district_value","city_dista_name","city_dista_value","city_distb_name","city_distb_value","city_distc_name","city_distc_value","city_distd_name","city_distd_value","date_last_voted","party_last_voted","date_added","date_changed","district_combo","race_desc","last_contact_date"
" 141","08566997","A","LAGRANGE","30241","1994","2016-06-14 04:00:00","WH","F","","","","03","03","003","029","132","COWE","5","7","","","","","LAGRANGE","333","CITYL","2","","","","","","","","","","","2020-11-03 05:00:00","","2012-01-06 05:00:00","2020-11-14 05:00:00","313","White not of Hispanic Origin","2020-11-03 05:00:00"
" 025","04932354","A","GARDEN CITY","31408","1980","2019-10-30 04:00:00","WH","F","","","","7-05C","7-05G","001","002","162","EAST","7","7","","","","","GARDEN CITY","250","WARD","1","","","","","","","","","","","2020-11-03 05:00:00","","2000-05-16 04:00:00","2020-11-14 05:00:00","444","White not of Hispanic Origin","2020-11-03 05:00:00"
" 025","05336877","A","SAVANNAH","31401","1957","2007-01-17 05:00:00","BH","M","","","","2-05C","2-05S","001","002","163","EAST","2","2","","","","","SAVANNAH","537","CITYL","2","","","","","","","","","","","2020-11-03 05:00:00","","2001-09-19 04:00:00","2020-11-14 05:00:00","407","Black not of Hispanic Origin","2020-11-03 05:00:00"
" 025","01551192","A","SAVANNAH","314053755","1960","1986-01-01 05:00:00","BH","F","","","","5-05C","5-05S","001","002","163","EAST","5","5","","","","","SAVANNAH","537","CITYL","5","","","","","","","","","","","2020-11-03 05:00:00","","1995-05-12 04:00:00","2020-11-14 05:00:00","423","Black not of Hispanic Origin","2020-11-03 05:00:00"

    `