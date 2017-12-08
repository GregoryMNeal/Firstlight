-- CREATE TABLES (trainer, trainee, measurements)

CREATE TABLE trainer (
	id SERIAL NOT NULL PRIMARY KEY,
	trainer_name VARCHAR,
	certifications VARCHAR,
	active BOOLEAN DEFAULT true
);

CREATE TABLE trainee (
	id SERIAL NOT NULL PRIMARY KEY,
	name VARCHAR,
	email VARCHAR UNIQUE,
	dob DATE,
	weight_goal DECIMAL,
	bmi_goal DECIMAL,
	pword VARCHAR,
	trainer_id INTEGER REFERENCES trainer (id)
);

CREATE TABLE measurements (
	id SERIAL NOT NULL PRIMARY KEY,
	measure_date DATE,
	height_ft INTEGER,
	height_in INTEGER,
	weight DECIMAL,
	caliper_chest INTEGER,
	caliper_subscap INTEGER,
	caliper_abd INTEGER,
	caliper_suprillac INTEGER,
	caliper_thigh INTEGER,
	caliper_lowback INTEGER,
	caliper_bicep INTEGER,
	caliper_calf INTEGER,
	caliper_tricep INTEGER,
	girth_shoulders DECIMAL,
	girth_chest DECIMAL,
	girth_waist DECIMAL,
	girth_hips DECIMAL,
	girth_thigh_l DECIMAL,
	girth_thigh_r DECIMAL,
	girth_calf_l DECIMAL,
	girth_calf_r DECIMAL,
	girth_bicep_l DECIMAL,
	girth_bicep_r DECIMAL,
	fat_lbs DECIMAL,
	lean_mass DECIMAL,
	body_fat_pct DECIMAL,
	trainee_id INTEGER REFERENCES trainee (id)
);
