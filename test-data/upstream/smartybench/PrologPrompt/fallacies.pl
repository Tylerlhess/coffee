has_rule(library, silence_please).
rule_unreasonble_interpretation(silence_please, absolutely_no_sound).
rule_reasonable_interpretation(silence_please, quiet_activities_allowed).

has_rule(highway, maximum_speed_65).
rule_unreasonble_interpretation(maximum_speed_65, always_drive_exactly_65).
rule_reasonable_interpretation(maximum_speed_65, drive_up_to_65_when_safe).

has_rule(medicine, take_with_food).
rule_unreasonble_interpretation(take_with_food, only_with_full_meal).
rule_reasonable_interpretation(take_with_food, with_some_food_to_prevent_stomach_upset).

has_rule(store, no_shoes_no_service).
rule_unreasonble_interpretation(no_shoes_no_service, only_conventional_shoes_acceptable).
rule_reasonable_interpretation(no_shoes_no_service, feet_must_be_covered_for_hygiene).

has_rule(restaurant, wait_to_be_seated).
rule_unreasonble_interpretation(wait_to_be_seated, never_sit_without_explicit_permission).
rule_reasonable_interpretation(wait_to_be_seated, follow_normal_seating_procedure).

has_rule(hotel, do_not_disturb).
rule_unreasonble_interpretation(do_not_disturb, never_enter_under_any_circumstances).
rule_reasonable_interpretation(do_not_disturb, no_routine_services_or_non_emergencies).

has_rule(food_label, best_before_date).
rule_unreasonble_interpretation(best_before_date, inedible_after_exact_date).
rule_reasonable_interpretation(best_before_date, quality_guideline_use_judgment).

has_rule(pool, no_diving_shallow_end).
rule_unreasonble_interpretation(no_diving_shallow_end, never_submerge_head_for_any_reason).
rule_reasonable_interpretation(no_diving_shallow_end, no_headfirst_entries_for_safety).

has_rule(theater, no_talking).
rule_unreasonble_interpretation(no_talking, absolutely_no_speech_under_any_circumstances).
rule_reasonable_interpretation(no_talking, avoid_disruptive_conversation_during_film).

has_rule(restaurant, free_refills).
rule_unreasonble_interpretation(free_refills, only_while_continuously_present).
rule_reasonable_interpretation(free_refills, during_the_course_of_your_meal).

has_rule(classroom, raise_hand_before_speaking).
rule_unreasonble_interpretation(raise_hand_before_speaking, no_exceptions_even_for_emergencies).
rule_reasonable_interpretation(raise_hand_before_speaking, orderly_participation_during_normal_discussion).

has_rule(museum, no_photography).
rule_unreasonble_interpretation(no_photography, no_photos_under_any_circumstances).
rule_reasonable_interpretation(no_photography, no_recreational_photos_of_exhibits).

has_rule(zoo, do_not_feed_animals).
rule_unreasonble_interpretation(do_not_feed_animals, absolutely_no_food_provision_by_anyone).
rule_reasonable_interpretation(do_not_feed_animals, visitors_should_not_provide_unauthorized_food).

has_rule(school, no_cell_phones).
rule_unreasonble_interpretation(no_cell_phones, no_phones_even_for_medical_purposes).
rule_reasonable_interpretation(no_cell_phones, no_disruptive_recreational_use).

has_rule(airplane, seatbelts_during_turbulence).
rule_unreasonble_interpretation(seatbelts_during_turbulence, remain_seated_regardless_of_emergencies).
rule_reasonable_interpretation(seatbelts_during_turbulence, stay_seated_for_normal_safety_precautions).

has_rule(book_club, finish_book_before_discussion).
rule_unreasonble_interpretation(finish_book_before_discussion, must_read_every_single_word).
rule_reasonable_interpretation(finish_book_before_discussion, complete_main_narrative_for_meaningful_participation).

has_rule(mattress, do_not_remove_tag).
rule_unreasonble_interpretation(do_not_remove_tag, consumers_can_never_remove_tag).
rule_reasonable_interpretation(do_not_remove_tag, sellers_cannot_remove_tag_before_sale).

has_rule(pedestrian_safety, cross_at_crosswalks).
rule_unreasonble_interpretation(cross_at_crosswalks, never_cross_elsewhere_even_in_emergencies).
rule_reasonable_interpretation(cross_at_crosswalks, use_crosswalks_when_available_and_safe).

has_rule(gym, wipe_equipment_after_use).
rule_unreasonble_interpretation(wipe_equipment_after_use, wipe_any_equipment_touched_regardless_of_use).
rule_reasonable_interpretation(wipe_equipment_after_use, clean_equipment_after_sweating_on_it).

has_rule(recipe, bake_for_thirty_minutes).
rule_unreasonble_interpretation(bake_for_thirty_minutes, always_exactly_thirty_minutes_regardless_of_outcome).
rule_reasonable_interpretation(bake_for_thirty_minutes, approximately_thirty_minutes_until_properly_cooked).

has_rule(shampoo_bottle, lather_rinse_repeat).
rule_reasonable_interpretation(lather_rinse_repeat, wash_once_or_twice).
rule_unreasonble_interpretation(lather_rinse_repeat, infinite_washing).

accident_fallacy(Entity, Rule, Reasonable, Misapplied) :-
    has_rule(Entity, Rule),
    rule_reasonable_interpretation(Rule, Reasonable),
    rule_unreasonble_interpretation(Rule, Misapplied),
    Reasonable \= Misapplied.

listall_accident_fallacies :-
    accident_fallacy(Entity, Rule, Reasonable, Misapplied),
    write('Since '), write(Entity), write(' has the rule "'), write(Rule), 
    write('", which reasonably means "'), write(Reasonable), 
    write('", but was misapplied as "'), write(Misapplied),
    write('", this is an accident fallacy.'), nl,
    fail.
listall_accident_fallacies.

cause(rain, wet_streets).

cause(fever, thermometer_rising).

cause(boiling_water, steam).

cause(fire, smoke).

cause(time_passing, watch_ticking).

cause(full_moon, werewolf_transformation).

cause(sunset, red_sky).

cause(lightning, thunder).

cause(sunrise, rooster_crowing).

cause(wind, windmill_turning).

cause(heat, sweat).

cause(pepper, sneezing).

cause(storm, falling_barometer).

cause(old_age, memory_loss).

cause(light, shadow).

cause(wind, waves).

cause(magnetic_field, compass_pointing_north).

cause(moon_position, high_tide).

cause(bacteria, food_spoiling).

cause(people_walking, footprints).

cause(meteor, crater).

cause(move_eye_close_to_mirror, mirror_looks_like_eye).

only_cause(X, Y) :-
    cause(X, Y),
    \+ (cause(Z, Y), Z \= X).

Wrong_direction(P, Q) :-
    only_cause(Q, P),
    \+ cause(P, Q).

listall_wrong_direction :-
    false_cause(P, Q),
    write('Since '), write(P), write(' appears with '), write(Q), 
    write(', '), write(P), write(' must cause '), write(Q), write('.'), nl,
    fail.

has_effect(brush_teeth, 2_mins, teeth_health_for_that_day).
has_effect(brush_teeth, 14_mins, teeth_health_for_one_week).
valid_accmulate(2_mins, repeat_7_times_in_one_go, 14_mins).
\+valid_accmulate(teeth_health_for_that_day, repeat_7_times_in_one_go, teeth_health_for_one_week).

has_effect(study, 3_hours, knowledge_for_one_chapter).
has_effect(study, 15_hours, mastery_of_entire_subject).
valid_accmulate(3_hours, repeat_5_times_in_one_go, 15_hours).
\+valid_accmulate(knowledge_for_one_chapter, repeat_5_times_in_one_go, mastery_of_entire_subject).

has_effect(water_plant, 100_ml, hydration_for_one_day).
has_effect(water_plant, 700_ml, healthy_plant_for_week).
valid_accmulate(100_ml, repeat_7_times_at_once, 700_ml).
\+valid_accmulate(hydration_for_one_day, repeat_7_times_at_once, healthy_plant_for_week).

has_effect(jog, 30_mins, calorie_burn_for_session).
has_effect(jog, 210_mins, significant_weight_loss).
valid_accmulate(30_mins, repeat_7_times_in_one_day, 210_mins).
\+valid_accmulate(calorie_burn_for_session, repeat_7_times_in_one_day, significant_weight_loss).

has_effect(take_medication, 1_pill, symptom_relief_for_4_hours).
has_effect(take_medication, 6_pills, complete_recovery).
valid_accmulate(1_pill, repeat_6_times_at_once, 6_pills).
\+valid_accmulate(symptom_relief_for_4_hours, repeat_6_times_at_once, complete_recovery).

has_effect(practice_piano, 1_hour, skill_improvement_for_day).
has_effect(practice_piano, 1000_hours, mastery_of_instrument).
valid_accmulate(1_hour, repeat_1000_times, 1000_hours).
\+valid_accmulate(skill_improvement_for_day, repeat_1000_times, mastery_of_instrument).

has_effect(save, 10_dollars, small_contribution).
has_effect(save, 3650_dollars, significant_financial_security).
valid_accmulate(10_dollars, repeat_365_times, 3650_dollars).
\+valid_accmulate(small_contribution, repeat_365_times, significant_financial_security).

has_effect(learn_vocabulary, 5_words, minor_vocab_improvement).
has_effect(learn_vocabulary, 500_words, basic_conversation_ability).
valid_accmulate(5_words, repeat_100_times_at_once, 500_words).
\+valid_accmulate(minor_vocab_improvement, repeat_100_times_at_once, basic_conversation_ability).

has_effect(lay_brick, 1_brick, tiny_portion_of_wall).
has_effect(lay_brick, 1000_bricks, complete_house_wall).
valid_accmulate(1_brick, repeat_1000_times, 1000_bricks).
\+valid_accmulate(tiny_portion_of_wall, repeat_1000_times, complete_house_wall).

has_effect(eat_apple, 1_apple, minor_nutritional_benefit).
has_effect(eat_apple, 30_apples, balanced_diet_for_month).
valid_accmulate(1_apple, repeat_30_times_at_once, 30_apples).
\+valid_accmulate(minor_nutritional_benefit, repeat_30_times_at_once, balanced_diet_for_month).

has_effect(read_chapter, 1_chapter, understanding_of_chapter).
has_effect(read_chapter, 20_chapters, comprehensive_subject_knowledge).
valid_accmulate(1_chapter, repeat_20_times_in_one_sitting, 20_chapters).
\+valid_accmulate(understanding_of_chapter, repeat_20_times_in_one_sitting, comprehensive_subject_knowledge).

has_effect(sleep, 8_hours, daily_rest).
has_effect(sleep, 56_hours, full_recovery_from_exhaustion).
valid_accmulate(8_hours, repeat_7_times_in_one_go, 56_hours).
\+valid_accmulate(daily_rest, repeat_7_times_in_one_go, full_recovery_from_exhaustion).

has_effect(paint_wall, 1_gallon, coverage_for_one_room).
has_effect(paint_wall, 5_gallons, complete_house_exterior).
valid_accmulate(1_gallon, repeat_5_times, 5_gallons).
\+valid_accmulate(coverage_for_one_room, repeat_5_times, complete_house_exterior).

has_effect(take_vitamin, 1_tablet, daily_nutrition_boost).
has_effect(take_vitamin, 30_tablets, long_term_health_improvement).
valid_accmulate(1_tablet, repeat_30_times_at_once, 30_tablets).
\+valid_accmulate(daily_nutrition_boost, repeat_30_times_at_once, long_term_health_improvement).

has_effect(write_code, 100_lines, simple_function).
has_effect(write_code, 10000_lines, complete_application).
valid_accmulate(100_lines, repeat_100_times, 10000_lines).
\+valid_accmulate(simple_function, repeat_100_times, complete_application).

has_effect(lift_weights, 30_mins, muscle_fatigue).
has_effect(lift_weights, 900_mins, significant_muscle_gain).
valid_accmulate(30_mins, repeat_30_times, 900_mins).
\+valid_accmulate(muscle_fatigue, repeat_30_times, significant_muscle_gain).

has_effect(change_oil, 1_time, engine_protection_for_3_months).
has_effect(change_oil, 20_times, extended_vehicle_lifespan).
valid_accmulate(1_time, repeat_20_times, 20_times).
\+valid_accmulate(engine_protection_for_3_months, repeat_20_times, extended_vehicle_lifespan).

has_effect(write_paragraph, 1_paragraph, expression_of_single_idea).
has_effect(write_paragraph, 50_paragraphs, comprehensive_thesis).
valid_accmulate(1_paragraph, repeat_50_times, 50_paragraphs).
\+valid_accmulate(expression_of_single_idea, repeat_50_times, comprehensive_thesis).

has_effect(give_speech, 5_mins, brief_message_delivery).
has_effect(give_speech, 60_mins, persuasive_attitude_change).
valid_accmulate(5_mins, repeat_12_times_continuously, 60_mins).
\+valid_accmulate(brief_message_delivery, repeat_12_times_continuously, persuasive_attitude_change).

has_effect(plant_seed, 1_seed, single_plant_growth).
has_effect(plant_seed, 1000_seeds, sustainable_food_source).
valid_accmulate(1_seed, repeat_1000_times, 1000_seeds).
\+valid_accmulate(single_plant_growth, repeat_1000_times, sustainable_food_source).

has_effect(solve_practice_problem, 1_problem, understanding_specific_concept).
has_effect(solve_practice_problem, 200_problems, exam_readiness).
valid_accmulate(1_problem, repeat_200_times, 200_problems).
\+valid_accmulate(understanding_specific_concept, repeat_200_times, exam_readiness).

improper_dist(A, B, C, D) :-
    has_effect(E, A, C),
    has_effect(E, B, D),
    valid_accmulate(A, F, B),
    \+valid_accmulate(C, F, D).

listall_improper_dist :-
    improper_dist(A, B, C, D),
    has_effect(E, A, C),
    has_effect(E, B, D),
    valid_accmulate(A, F, B),
    format('Since ~w for ~w is recommended, and these can be accumulated to ~w for ~w at once,~n', [E, A, E, B]),
    format('and ~w for ~w has the same effect as distributing it, therefore ~w once should be equivalent to ~w.~n', [E, B, D, C]),
    format('However, this is an improper distribution fallacy because ~w repeated ~w does not equal ~w.~n~n', [C, F, D]),
    fail.

incorporate(hornet, horn_word).
incorporate(french_horn, horn_word).
incorporate(hornet, makes_buzzing_sound).

incorporate(animal_bat, bat_word).
incorporate(baseball_bat, bat_word).
incorporate(animal_bat, can_fly).

incorporate(caterpillar, cat_word).
incorporate(cat, cat_word).
incorporate(caterpillar, transforms_to_butterfly).

incorporate(computer_mouse, mouse_word).
incorporate(animal_mouse, mouse_word).
incorporate(computer_mouse, can_click).

incorporate(insect_fly, fly_word).
incorporate(time_flies, fly_word).
incorporate(insect_fly, is_insect).

incorporate(dog, dog_word).
incorporate(hot_dog, dog_word).
incorporate(dog, is_animal).

incorporate(butter, butter_word).
incorporate(butterfly, butter_word).
incorporate(butter, melts_when_heated).

incorporate(egg, egg_word).
incorporate(eggplant, egg_word).
incorporate(egg, from_chicken).

incorporate(horse, horse_word).
incorporate(seahorse, horse_word).
incorporate(horse, runs_on_land).

incorporate(straw, straw_word).
incorporate(strawberry, straw_word).
incorporate(straw, from_wheat).

incorporate(metal_nail, nail_word).
incorporate(fingernail, nail_word).
incorporate(metal_nail, hit_by_hammer).

incorporate(sand, sand_word).
incorporate(sandwich, sand_word).
incorporate(sand, found_at_beach).

incorporate(lady, lady_word).
incorporate(ladybug, lady_word).
incorporate(lady, is_human).

incorporate(earthquake, shake_word).
incorporate(milkshake, shake_word).
incorporate(earthquake, shakes_ground).

incorporate(fire, fire_word).
incorporate(firefly, fire_word).
incorporate(fire, is_hot).

incorporate(apple, apple_word).
incorporate(pineapple, apple_word).
incorporate(apple, grows_on_trees).

incorporate(buffalo_animal, buffalo_word).
incorporate(buffalo_wing, buffalo_word).
incorporate(buffalo_animal, can_roam).

incorporate(blackboard, black_word).
incorporate(black_bear, black_word).
incorporate(blackboard, for_writing).

incorporate(fish, fish_word).
incorporate(silverfish, fish_word).
incorporate(fish, swims_in_water).

incorporate(airplane, air_word).
incorporate(air_freshener, air_word).
incorporate(airplane, can_fly).

incorporate(kidney, kid_word).
incorporate(kid, kid_word).
incorporate(kid, grow_into_adult).

false_analogy(P, Q, X, Y) :- 
    incorporate(P, X),
    incorporate(Q, X),
    incorporate(P, Y),
    P \= Q,
    \+ incorporate(Q, Y).

listall_falseanalogy :- 
    false_analogy(P, Q, X, Y),
    write('Since both '), write(P), write(' and '), write(Q), 
    write(' have the property "'), write(X), write('", and '), 
    write(P), write(' has the property "'), write(Y), write('",'), 
    nl,
    write('it\'s a false analogy to conclude that '), 
    write(Q), write(' must also have the property "'), write(Y), write('".'), 
    nl, nl, 
    fail.

listall_falseanalogy.

established_fact(vitamins_essential_for_health, vitamin_c_prevents_scurvy).
false_premise(vitamin_c_prevents_scurvy, letter_determines_disease_prevention).
plausible_observation(vitamin_d_exists, letter_determines_disease_prevention).
false_premise_lead_conclusion(letter_determines_disease_prevention, vitamin_d_exists, vitamin_d_prevents_dysentery).

established_fact(objects_fall_due_to_gravity, earth_gravity_is_9_8).
false_premise(earth_gravity_is_9_8, planet_name_determines_gravity).
plausible_observation(mars_is_a_planet, planet_name_determines_gravity).
false_premise_lead_conclusion(planet_name_determines_gravity, mars_is_a_planet, mars_gravity_is_13).

established_fact(moon_orbits_earth, moon_has_no_atmosphere).
false_premise(moon_has_no_atmosphere, orbit_determines_atmosphere).
plausible_observation(planets_orbit_sun, orbit_determines_atmosphere).
false_premise_lead_conclusion(orbit_determines_atmosphere, planets_orbit_sun, planets_cannot_have_atmosphere).

established_fact(bananas_are_yellow, bananas_contain_potassium).
false_premise(bananas_contain_potassium, food_color_determines_minerals).
plausible_observation(lemons_are_yellow, food_color_determines_minerals).
false_premise_lead_conclusion(food_color_determines_minerals, lemons_are_yellow, lemons_high_in_potassium).

established_fact(water_is_h2o, water_is_liquid_at_room_temp).
false_premise(water_is_liquid_at_room_temp, atom_count_determines_state).
plausible_observation(methane_has_five_atoms, atom_count_determines_state).
false_premise_lead_conclusion(atom_count_determines_state, methane_has_five_atoms, methane_is_liquid_at_room_temp).

established_fact(square_has_four_sides, square_angles_sum_to_360).
false_premise(square_angles_sum_to_360, sides_determine_angle_sum).
plausible_observation(triangle_has_three_sides, sides_determine_angle_sum).
false_premise_lead_conclusion(sides_determine_angle_sum, triangle_has_three_sides, triangle_angles_sum_to_270).

established_fact(nile_flows_north, nile_is_in_africa).
false_premise(nile_is_in_africa, river_direction_determines_continent).
plausible_observation(amazon_flows_east, river_direction_determines_continent).
false_premise_lead_conclusion(river_direction_determines_continent, amazon_flows_east, amazon_is_in_europe).

established_fact(english_is_germanic, english_uses_latin_alphabet).
false_premise(english_uses_latin_alphabet, language_family_determines_writing).
plausible_observation(japanese_not_germanic, language_family_determines_writing).
false_premise_lead_conclusion(language_family_determines_writing, japanese_not_germanic, japanese_cannot_use_latin_characters).

established_fact(computers_use_binary, computers_can_multiply).
false_premise(computers_can_multiply, number_base_limits_operations).
plausible_observation(humans_use_base_10, number_base_limits_operations).
false_premise_lead_conclusion(number_base_limits_operations, humans_use_base_10, humans_cannot_multiply).

established_fact(sleep_aids_memory, dreams_occur_in_rem).
false_premise(dreams_occur_in_rem, all_cognition_requires_dreams).
plausible_observation(some_people_dont_remember_dreams, all_cognition_requires_dreams).
false_premise_lead_conclusion(all_cognition_requires_dreams, some_people_dont_remember_dreams, cannot_form_longterm_memories).

established_fact(roman_empire_lasted_centuries, romans_had_cultural_impact).
false_premise(romans_had_cultural_impact, empire_longevity_determines_influence).
plausible_observation(mongol_empire_shorter_duration, empire_longevity_determines_influence).
false_premise_lead_conclusion(empire_longevity_determines_influence, mongol_empire_shorter_duration, mongols_had_no_impact).

established_fact(pianos_are_large, pianos_have_88_keys).
false_premise(pianos_have_88_keys, instrument_size_determines_notes).
plausible_observation(violins_are_smaller, instrument_size_determines_notes).
false_premise_lead_conclusion(instrument_size_determines_notes, violins_are_smaller, violins_play_few_notes).

established_fact(plants_are_green, plants_use_photosynthesis).
false_premise(plants_use_photosynthesis, color_determines_energy_source).
plausible_observation(mushrooms_not_green, color_determines_energy_source).
false_premise_lead_conclusion(color_determines_energy_source, mushrooms_not_green, mushrooms_use_sound_energy).

established_fact(lightning_is_electrical, lightning_comes_before_thunder).
false_premise(lightning_comes_before_thunder, timing_determines_causality).
plausible_observation(light_seen_before_sound_heard, timing_determines_causality).
false_premise_lead_conclusion(timing_determines_causality, light_seen_before_sound_heard, light_causes_all_sound).

established_fact(inflation_starts_with_infl, inflation_decreases_purchasing_power).
false_premise(inflation_decreases_purchasing_power, similar_prefixes_same_effect).
plausible_observation(influence_starts_with_infl, similar_prefixes_same_effect).
false_premise_lead_conclusion(similar_prefixes_same_effect, influence_starts_with_infl, influence_decreases_currency).

established_fact(eiffel_tower_made_of_iron, eiffel_tower_in_paris).
false_premise(eiffel_tower_in_paris, material_determines_location).
plausible_observation(empire_state_made_of_steel, material_determines_location).
false_premise_lead_conclusion(material_determines_location, empire_state_made_of_steel, empire_state_in_asia).

established_fact(human_size_medium, human_heart_rate_60_to_100).
false_premise(human_heart_rate_60_to_100, size_proportional_to_heart_rate).
plausible_observation(elephants_larger_than_humans, size_proportional_to_heart_rate).
false_premise_lead_conclusion(size_proportional_to_heart_rate, elephants_larger_than_humans, elephant_heart_rate_200_plus).

established_fact(dinosaurs_extinct_by_meteor, dinosaurs_lived_millions_years_ago).
false_premise(dinosaurs_lived_millions_years_ago, extinction_cause_determines_era).
plausible_observation(dodos_extinct_by_hunting, extinction_cause_determines_era).
false_premise_lead_conclusion(extinction_cause_determines_era, dodos_extinct_by_hunting, dodos_lived_millions_years_ago).

established_fact(justices_serve_lifetime, justices_interpret_law).
false_premise(justices_interpret_law, tenure_determines_judgment_authority).
plausible_observation(athletes_have_short_careers, tenure_determines_judgment_authority).
false_premise_lead_conclusion(tenure_determines_judgment_authority, athletes_have_short_careers, athletes_cannot_judge_rules).

established_fact(shakespeare_wrote_english, shakespeare_wrote_sonnets).
false_premise(shakespeare_wrote_sonnets, language_determines_literary_form).
plausible_observation(haiku_originated_in_japanese, language_determines_literary_form).
false_premise_lead_conclusion(language_determines_literary_form, haiku_originated_in_japanese, english_writers_cannot_write_haiku).

established_fact(people_has_two_lungs, two_lungs_breathe_out_carbon_dioxide).
false_premise(two_lungs_breathe_out_carbon_dioxide, lung_number_influence_carbon_number).
plausible_observation(people_can_have_one_lung, lung_number_influence_carbon_number).
false_premise_lead_conclusion(lung_number_influence_carbon_number, people_can_have_one_lung, one_lung_breathe_out_carbon_monoxide).

false_premise(FactCondition, FactResult, FalsePremise, ValidObservation, FalsePremiseConclusion) :- 
    established_fact(FactCondition, FactResult), 
    false_premise(FactResult, FalsePremise), 
    plausible_observation(ValidObservation, FalsePremise),
    false_premise_lead_conclusion(FalsePremise, ValidObservation, FalsePremiseConclusion).

listall_falsepremise :-
    false_premise(FactCondition, FactResult, FalsePremise, ValidObservation, FalsePremiseConclusion),
    write('Given that "'), write(FactCondition), write('" establishes "'), write(FactResult), 
    write('", the false premise that "'), write(FactResult), write('" implies "'), write(FalsePremise),
    write('", combined with observation "'), write(ValidObservation),
    write('", leads to the incorrect conclusion that "'), write(FalsePremiseConclusion),
    write('".'), nl,
    fail.

listall_falsepremise :- true.

has_property(brakes, can_stop).
is_part_of(brakes, car).
lacks_property(car, can_stop).
fallacy_of_composition(brakes, can_stop, car).

has_property(cpu, processes_information).
is_part_of(cpu, computer).
lacks_property(computer, processes_information).
fallacy_of_composition(cpu, processes_information, computer).

has_property(wheel, enables_movement).
is_part_of(wheel, bicycle).
lacks_property(bicycle, enables_movement).
fallacy_of_composition(wheel, enables_movement, bicycle).

has_property(airbag, protects_in_crash).
is_part_of(airbag, car).
lacks_property(car, protects_in_crash).
fallacy_of_composition(airbag, protects_in_crash, car).

has_property(foundation, provides_stability).
is_part_of(foundation, building).
lacks_property(building, provides_stability).
fallacy_of_composition(foundation, provides_stability, building).

has_property(heart, pumps_blood).
is_part_of(heart, body).
lacks_property(body, pumps_blood).
fallacy_of_composition(heart, pumps_blood, body).

has_property(fire_alarm, detects_fire).
is_part_of(fire_alarm, building).
lacks_property(building, detects_fire).
fallacy_of_composition(fire_alarm, detects_fire, building).

has_property(diamond, extreme_hardness).
is_part_of(diamond, ring).
lacks_property(ring, extreme_hardness).
fallacy_of_composition(diamond, extreme_hardness, ring).

has_property(helmet, protects_head).
is_part_of(helmet, cycling_gear).
lacks_property(cycling_gear, protects_head).
fallacy_of_composition(helmet, protects_head, cycling_gear).

has_property(antibiotic, kills_bacteria).
is_part_of(antibiotic, medicine).
lacks_property(medicine, kills_bacteria).
fallacy_of_composition(antibiotic, kills_bacteria, medicine).

has_property(lens, focuses_light).
is_part_of(lens, camera).
lacks_property(camera, focuses_light).
fallacy_of_composition(lens, focuses_light, camera).

has_property(goalkeeper, can_use_hands).
is_part_of(goalkeeper, soccer_team).
lacks_property(soccer_team, can_use_hands).
fallacy_of_composition(goalkeeper, can_use_hands, soccer_team).

has_property(lock, secures_entry).
is_part_of(lock, door).
lacks_property(door, secures_entry).
fallacy_of_composition(lock, secures_entry, door).

has_property(battery, provides_power).
is_part_of(battery, electronic_device).
lacks_property(electronic_device, provides_power).
fallacy_of_composition(battery, provides_power, electronic_device).

has_property(shock_absorber, cushions_impact).
is_part_of(shock_absorber, vehicle).
lacks_property(vehicle, cushions_impact).
fallacy_of_composition(shock_absorber, cushions_impact, vehicle).

has_property(lightbulb, produces_light).
is_part_of(lightbulb, house).
lacks_property(house, produces_light).
fallacy_of_composition(lightbulb, produces_light, house).

has_property(cork, floats).
is_part_of(cork, wine_bottle).
lacks_property(wine_bottle, floats).
fallacy_of_composition(cork, floats, wine_bottle).

has_property(vitamin, provides_nutrients).
is_part_of(vitamin, food).
lacks_property(food, provides_nutrients).
fallacy_of_composition(vitamin, provides_nutrients, food).

has_property(steel_beam, supports_weight).
is_part_of(steel_beam, bridge).
lacks_property(bridge, supports_weight).
fallacy_of_composition(steel_beam, supports_weight, bridge).

has_property(spine, enables_flexibility).
is_part_of(spine, body).
lacks_property(body, enables_flexibility).
fallacy_of_composition(spine, enables_flexibility, body).

fallacy_of_composition(Component, Property, Whole) :- 
    has_property(Component, Property),
    is_part_of(Component, Whole),
    lacks_property(Whole, Property).

listall_composition_fallacies :-
    fallacy_of_composition(Component, Property, Whole),
    write('Since '), write(Component), write(' has '), write(Property), 
    write(', then '), write(Whole), write(' made entirely of '), 
    write(Component), write(' would be the best '), write(Property), write('.'),
    nl,
    fail.

begging_the_question(A, B) :-
    claim_and_argument(A, B), 
    explicit_meaning_of_argument(B, C), 
    explcit_meaning_rely_on_claim(C, A).

claim_and_argument(bible_true, bible_word_of_god).
explicit_meaning_of_argument(bible_word_of_god, bible_says_god_exists).
explcit_meaning_rely_on_claim(bible_says_god_exists, bible_true).

claim_and_argument(free_markets_most_efficient, free_markets_maximize_efficiency).
explicit_meaning_of_argument(free_markets_maximize_efficiency, markets_defined_by_efficiency).
explcit_meaning_rely_on_claim(markets_defined_by_efficiency, free_markets_most_efficient).

claim_and_argument(evolution_is_scientific, scientific_consensus_supports_evolution).
explicit_meaning_of_argument(scientific_consensus_supports_evolution, scientists_accept_evolution_as_scientific).
explcit_meaning_rely_on_claim(scientists_accept_evolution_as_scientific, evolution_is_scientific).

claim_and_argument(democracy_is_best, people_prefer_democracy).
explicit_meaning_of_argument(people_prefer_democracy, democracy_allows_people_preferences).
explcit_meaning_rely_on_claim(democracy_allows_people_preferences, democracy_is_best).

claim_and_argument(alternative_medicine_works, people_healed_by_alternative_medicine).
explicit_meaning_of_argument(people_healed_by_alternative_medicine, alternative_medicine_causes_healing).
explcit_meaning_rely_on_claim(alternative_medicine_causes_healing, alternative_medicine_works).

claim_and_argument(climate_change_not_real, weather_changes_are_natural_variations).
explicit_meaning_of_argument(weather_changes_are_natural_variations, changes_not_caused_by_climate_change).
explcit_meaning_rely_on_claim(changes_not_caused_by_climate_change, climate_change_not_real).

claim_and_argument(morality_from_god, good_behaviors_are_god_commands).
explicit_meaning_of_argument(good_behaviors_are_god_commands, god_defines_morality).
explcit_meaning_rely_on_claim(god_defines_morality, morality_from_god).

claim_and_argument(psychic_powers_exist, people_predict_events_psychically).
explicit_meaning_of_argument(people_predict_events_psychically, predictions_due_to_psychic_powers).
explcit_meaning_rely_on_claim(predictions_due_to_psychic_powers, psychic_powers_exist).

claim_and_argument(free_will_does_not_exist, choices_determined_by_prior_causes).
explicit_meaning_of_argument(choices_determined_by_prior_causes, no_choice_is_free).
explcit_meaning_rely_on_claim(no_choice_is_free, free_will_does_not_exist).

claim_and_argument(vaccines_are_dangerous, people_get_sick_after_vaccination).
explicit_meaning_of_argument(people_get_sick_after_vaccination, vaccines_cause_sickness).
explcit_meaning_rely_on_claim(vaccines_cause_sickness, vaccines_are_dangerous).

claim_and_argument(ghosts_exist, people_have_seen_ghosts).
explicit_meaning_of_argument(people_have_seen_ghosts, visual_experiences_are_of_ghosts).
explcit_meaning_rely_on_claim(visual_experiences_are_of_ghosts, ghosts_exist).

claim_and_argument(astrology_predicts_personality, traits_match_astrological_signs).
explicit_meaning_of_argument(traits_match_astrological_signs, astrology_correctly_identifies_traits).
explcit_meaning_rely_on_claim(astrology_correctly_identifies_traits, astrology_predicts_personality).

claim_and_argument(government_hiding_aliens, denial_proves_coverup).
explicit_meaning_of_argument(denial_proves_coverup, government_lying_about_aliens).
explcit_meaning_rely_on_claim(government_lying_about_aliens, government_hiding_aliens).

claim_and_argument(mind_separate_from_brain, mental_phenomena_not_physical).
explicit_meaning_of_argument(mental_phenomena_not_physical, mind_operates_beyond_physical_laws).
explcit_meaning_rely_on_claim(mind_operates_beyond_physical_laws, mind_separate_from_brain).

claim_and_argument(modern_art_not_real_art, real_art_requires_traditional_skill).
explicit_meaning_of_argument(real_art_requires_traditional_skill, modern_methods_not_artistic).
explcit_meaning_rely_on_claim(modern_methods_not_artistic, modern_art_not_real_art).

claim_and_argument(socialism_does_not_work, all_socialist_countries_failed).
explicit_meaning_of_argument(all_socialist_countries_failed, successful_countries_not_socialist).
explcit_meaning_rely_on_claim(successful_countries_not_socialist, socialism_does_not_work).

claim_and_argument(miracles_happen, unexplainable_events_are_miraculous).
explicit_meaning_of_argument(unexplainable_events_are_miraculous, some_events_require_supernatural_cause).
explcit_meaning_rely_on_claim(some_events_require_supernatural_cause, miracles_happen).

claim_and_argument(traditional_education_best, alternative_methods_inferior).
explicit_meaning_of_argument(alternative_methods_inferior, traditional_metrics_define_quality).
explcit_meaning_rely_on_claim(traditional_metrics_define_quality, traditional_education_best).

claim_and_argument(traditional_gender_roles_natural, men_women_naturally_prefer_differently).
explicit_meaning_of_argument(men_women_naturally_prefer_differently, preferences_define_natural_roles).
explcit_meaning_rely_on_claim(preferences_define_natural_roles, traditional_gender_roles_natural).

claim_and_argument(technology_drives_social_change, society_adapts_to_technological_innovation).
explicit_meaning_of_argument(society_adapts_to_technological_innovation, social_change_follows_technology).
explcit_meaning_rely_on_claim(social_change_follows_technology, technology_drives_social_change).

claim_and_argument(economic_inequality_inevitable, attempts_at_equality_failed).
explicit_meaning_of_argument(attempts_at_equality_failed, equality_impossible_to_maintain).
explcit_meaning_rely_on_claim(equality_impossible_to_maintain, economic_inequality_inevitable).

listall_begging_question :-
    begging_the_question(Claim, Argument),
    write('Since '), 
    write(Argument), 
    write(', therefore '), 
    write(Claim), 
    write(' is a circular argument.'), 
    nl,
    fail.

quote_context(you_are_what_you_eat, nutrition_affects_physical_health).
quote_out_of_context(you_are_what_you_eat, you_physically_transform_into_food_consumed).
fact_related_out_of_context(you_physically_transform_into_food_consumed, vegetarians_only_eat_vegetables).
improper_fact_quote_out_of_context(vegetarians_only_eat_vegetables, vegetarians_are_turning_into_vegetables).

quote_context(money_doesnt_grow_on_trees, money_requires_effort_to_obtain).
quote_out_of_context(money_doesnt_grow_on_trees, money_cannot_be_produced_by_plants).
fact_related_out_of_context(money_cannot_be_produced_by_plants, paper_money_is_made_from_trees).
improper_fact_quote_out_of_context(paper_money_is_made_from_trees, trees_should_naturally_produce_money).

quote_context(early_bird_catches_worm, promptness_yields_rewards).
quote_out_of_context(early_bird_catches_worm, birds_born_earlier_are_better_at_catching_worms).
fact_related_out_of_context(birds_born_earlier_are_better_at_catching_worms, genetic_advantage_determines_success).
improper_fact_quote_out_of_context(genetic_advantage_determines_success, humans_born_in_morning_hours_are_more_intelligent).

quote_context(dont_put_all_eggs_in_one_basket, diversify_to_reduce_risk).
quote_out_of_context(dont_put_all_eggs_in_one_basket, literal_egg_distribution_requirement).
fact_related_out_of_context(literal_egg_distribution_requirement, egg_farmers_use_multiple_baskets).
improper_fact_quote_out_of_context(egg_farmers_use_multiple_baskets, more_baskets_improves_egg_quality).

quote_context(blood_is_thicker_than_water, family_ties_stronger_than_other_relationships).
quote_out_of_context(blood_is_thicker_than_water, blood_has_higher_viscosity_than_water).
fact_related_out_of_context(blood_has_higher_viscosity_than_water, dehydration_thickens_blood).
improper_fact_quote_out_of_context(dehydration_thickens_blood, dehydrated_people_have_stronger_family_bonds).

quote_context(curiosity_killed_the_cat, excessive_inquisitiveness_can_be_dangerous).
quote_out_of_context(curiosity_killed_the_cat, curiosity_is_lethal_to_felines).
fact_related_out_of_context(curiosity_is_lethal_to_felines, cats_are_naturally_curious_animals).
improper_fact_quote_out_of_context(cats_are_naturally_curious_animals, cats_would_be_extinct_if_kept_in_interesting_environments).

quote_context(lightning_never_strikes_twice, rare_events_unlikely_to_repeat).
quote_out_of_context(lightning_never_strikes_twice, lightning_physically_cannot_hit_same_spot_twice).
fact_related_out_of_context(lightning_physically_cannot_hit_same_spot_twice, lightning_rods_attract_lightning).
improper_fact_quote_out_of_context(lightning_rods_attract_lightning, lightning_rods_must_be_replaced_after_each_strike).

quote_context(pen_is_mightier_than_sword, written_word_has_more_influence_than_physical_force).
quote_out_of_context(pen_is_mightier_than_sword, pens_are_physically_stronger_than_swords).
fact_related_out_of_context(pens_are_physically_stronger_than_swords, modern_pens_made_with_titanium_components).
improper_fact_quote_out_of_context(modern_pens_made_with_titanium_components, pens_are_superior_weapons_in_sword_fights).

quote_context(great_minds_think_alike, intelligent_people_often_reach_similar_conclusions).
quote_out_of_context(great_minds_think_alike, intellectual_greatness_requires_conformity_of_thought).
fact_related_out_of_context(intellectual_greatness_requires_conformity_of_thought, original_thinkers_have_unique_ideas).
improper_fact_quote_out_of_context(original_thinkers_have_unique_ideas, innovative_people_cannot_be_intelligent).

quote_context(grass_is_greener_on_other_side, people_often_perceive_others_situations_as_better).
quote_out_of_context(grass_is_greener_on_other_side, neighboring_lawns_have_better_grass_coloration).
fact_related_out_of_context(neighboring_lawns_have_better_grass_coloration, fertilizers_enhance_grass_color).
improper_fact_quote_out_of_context(fertilizers_enhance_grass_color, jealousy_of_neighbors_improves_lawn_quality).

quote_context(absence_makes_heart_grow_fonder, separation_can_intensify_affection).
quote_out_of_context(absence_makes_heart_grow_fonder, physical_absence_causes_heart_organ_enlargement).
fact_related_out_of_context(physical_absence_causes_heart_organ_enlargement, some_medical_conditions_cause_enlarged_hearts).
improper_fact_quote_out_of_context(some_medical_conditions_cause_enlarged_hearts, separation_therapy_cures_heart_disease).

quote_context(birds_of_feather_flock_together, similar_people_tend_to_associate_with_each_other).
quote_out_of_context(birds_of_feather_flock_together, birds_only_associate_with_same_plumage_birds).
fact_related_out_of_context(birds_only_associate_with_same_plumage_birds, some_bird_species_have_varied_plumage).
improper_fact_quote_out_of_context(some_bird_species_have_varied_plumage, differently_colored_birds_of_same_species_cannot_form_flocks).

quote_context(watched_pot_never_boils, time_seems_to_pass_slower_when_waiting_and_watching).
quote_out_of_context(watched_pot_never_boils, observation_physically_prevents_water_from_boiling).
fact_related_out_of_context(observation_physically_prevents_water_from_boiling, quantum_physics_involves_observer_effect).
improper_fact_quote_out_of_context(quantum_physics_involves_observer_effect, looking_away_speeds_up_cooking_time).

quote_context(out_of_sight_out_of_mind, people_tend_to_forget_what_they_do_not_see).
quote_out_of_context(out_of_sight_out_of_mind, invisibility_causes_loss_of_cognitive_function).
fact_related_out_of_context(invisibility_causes_loss_of_cognitive_function, brain_processes_visual_stimuli).
improper_fact_quote_out_of_context(brain_processes_visual_stimuli, blind_people_have_diminished_intellectual_capacity).

quote_context(cant_teach_old_dog_new_tricks, established_habits_are_difficult_to_change).
quote_out_of_context(cant_teach_old_dog_new_tricks, elderly_canines_cannot_learn_any_new_skills).
fact_related_out_of_context(elderly_canines_cannot_learn_any_new_skills, dog_training_methods_vary_by_age).
improper_fact_quote_out_of_context(dog_training_methods_vary_by_age, training_efforts_should_be_abandoned_for_older_dogs).

quote_context(dont_judge_book_by_cover, appearances_can_be_deceiving).
quote_out_of_context(dont_judge_book_by_cover, book_covers_provide_no_useful_information).
fact_related_out_of_context(book_covers_provide_no_useful_information, publishers_invest_heavily_in_cover_design).
improper_fact_quote_out_of_context(publishers_invest_heavily_in_cover_design, selecting_books_should_only_be_done_blindfolded).

quote_context(apple_a_day_keeps_doctor_away, healthy_eating_promotes_wellness).
quote_out_of_context(apple_a_day_keeps_doctor_away, apples_repel_medical_professionals).
fact_related_out_of_context(apples_repel_medical_professionals, some_people_have_fruit_allergies).
improper_fact_quote_out_of_context(some_people_have_fruit_allergies, medical_schools_screen_for_apple_hatred).

quote_context(two_heads_better_than_one, collaboration_yields_better_results).
quote_out_of_context(two_heads_better_than_one, having_multiple_physical_heads_is_advantageous).
fact_related_out_of_context(having_multiple_physical_heads_is_advantageous, some_mythological_creatures_have_multiple_heads).
improper_fact_quote_out_of_context(some_mythological_creatures_have_multiple_heads, humans_should_evolve_to_have_two_heads).

quote_context(all_that_glitters_not_gold, valuable_appearances_may_be_deceptive).
quote_out_of_context(all_that_glitters_not_gold, shiny_materials_cannot_be_gold).
fact_related_out_of_context(shiny_materials_cannot_be_gold, gold_is_naturally_lustrous).
improper_fact_quote_out_of_context(gold_is_naturally_lustrous, dull_materials_are_more_likely_to_be_real_gold).

quote_context(customer_always_right, prioritize_customer_satisfaction_for_business_success).
quote_out_of_context(customer_always_right, customers_never_make_factual_errors).
fact_related_out_of_context(customers_never_make_factual_errors, customers_have_varying_levels_of_expertise).
improper_fact_quote_out_of_context(customers_have_varying_levels_of_expertise, consulting_customers_is_better_than_expert_advice).

contextomy(A, B) :-
    quote_context(A, C),
    quote_out_of_context(A, D),
    fact_related_out_of_context(D, F),
    improper_fact_quote_out_of_context(F, B).

show_all_contextomies :-
    contextomy(Quote, Conclusion),
    quote_out_of_context(Quote, Misinterpretation),
    fact_related_out_of_context(Misinterpretation, RelatedFact),
    write('Since '), write(Quote), 
    write(' literally means '), write(Misinterpretation), 
    write(', and '), write(RelatedFact), 
    write(', therefore '), write(Conclusion), write('.'), nl,
    fail.
show_all_contextomies.

complement_cases(is_raining, not_raining).
complement_cases(ground_is_wet, ground_not_wet).
implies(is_raining, ground_is_wet).
\+implies(ground_is_wet, is_raining).

complement_cases(is_bird, not_bird).
complement_cases(can_fly, cannot_fly).
implies(is_bird, can_fly).
\+implies(can_fly, is_bird).

complement_cases(is_mammal, not_mammal).
complement_cases(has_hair, has_no_hair).
implies(is_mammal, has_hair).
\+implies(has_hair, is_mammal).

complement_cases(is_student, not_student).
complement_cases(studies, does_not_study).
implies(is_student, studies).
\+implies(studies, is_student).

complement_cases(has_fire, no_fire).
complement_cases(has_smoke, no_smoke).
implies(has_fire, has_smoke).
\+implies(has_smoke, has_fire).

complement_cases(is_running, not_running).
complement_cases(elevated_heart_rate, normal_heart_rate).
implies(is_running, elevated_heart_rate).
\+implies(elevated_heart_rate, is_running).

complement_cases(is_driving_legally, not_driving_legally).
complement_cases(has_license, no_license).
implies(is_driving_legally, has_license).
\+implies(has_license, is_driving_legally).

complement_cases(is_poisonous_mushroom, not_poisonous_mushroom).
complement_cases(is_dangerous, not_dangerous).
implies(is_poisonous_mushroom, is_dangerous).
\+implies(is_dangerous, is_poisonous_mushroom).

complement_cases(is_triangle, not_triangle).
complement_cases(is_shape, not_shape).
implies(is_triangle, is_shape).
\+implies(is_shape, is_triangle).

complement_cases(is_tree, not_tree).
complement_cases(is_plant, not_plant).
implies(is_tree, is_plant).
\+implies(is_plant, is_tree).

complement_cases(is_metal, not_metal).
complement_cases(is_conductor, not_conductor).
implies(is_metal, is_conductor).
\+implies(is_conductor, is_metal).

complement_cases(is_dog, not_dog).
complement_cases(is_animal, not_animal).
implies(is_dog, is_animal).
\+implies(is_animal, is_dog).

complement_cases(is_swimming, not_swimming).
complement_cases(is_wet, not_wet).
implies(is_swimming, is_wet).
\+implies(is_wet, is_swimming).

complement_cases(is_snowing, not_snowing).
complement_cases(is_cold, not_cold).
implies(is_snowing, is_cold).
\+implies(is_cold, is_snowing).

complement_cases(is_coffee, not_coffee).
complement_cases(has_caffeine, no_caffeine).
implies(is_coffee, has_caffeine).
\+implies(has_caffeine, is_coffee).

complement_cases(is_infected, not_infected).
complement_cases(had_pathogen_exposure, no_pathogen_exposure).
implies(is_infected, had_pathogen_exposure).
\+implies(had_pathogen_exposure, is_infected).

complement_cases(is_mathematician, not_mathematician).
complement_cases(knows_algebra, doesnt_know_algebra).
implies(is_mathematician, knows_algebra).
\+implies(knows_algebra, is_mathematician).

complement_cases(is_prime, not_prime).
complement_cases(is_integer, not_integer).
implies(is_prime, is_integer).
\+implies(is_integer, is_prime).

complement_cases(is_vegetarian, not_vegetarian).
complement_cases(eats_no_meat, eats_meat).
implies(is_vegetarian, eats_no_meat).
\+implies(eats_no_meat, is_vegetarian).

complement_cases(is_olympic_qualifier, not_olympic_qualifier).
complement_cases(is_athlete, not_athlete).
implies(is_olympic_qualifier, is_athlete).
\+implies(is_athlete, is_olympic_qualifier).

inverse_error(D, E) :-  
    complement_cases(A,D),
    complement_cases(B,E),
    implies(A, B),
    \+implies(B, A).  

listall_inverse_error :-
    complement_cases(A, D),
    complement_cases(B, E),
    implies(A, B),
    \+implies(B, A),
    write('Since '), write(A), write(' implies '), write(B), 
    write(', therefore '), write(D), write(' must imply '), write(E), nl,
    fail.

implies(fever, feeling_hot).
implies(vigorous_exercise, feeling_hot).

implies(desert_environment, thirst).
implies(salty_food, thirst).

implies(allergies, sneezing).
implies(pepper_inhalation, sneezing).

implies(sleep_deprivation, tiredness).
implies(overexertion, tiredness).

implies(storm, loud_noise).
implies(concert, loud_noise).

implies(studying_hard, good_grades).
implies(cheating, good_grades).

implies(rain, flooded_streets).
implies(broken_water_main, flooded_streets).

implies(fire, smoke).
implies(barbecue, smoke).

implies(exercise, sweating).
implies(hot_weather, sweating).

implies(lack_of_sleep, irritability).
implies(hunger, irritability).

implies(virus_infection, coughing).
implies(smoking, coughing).

implies(winning_lottery, wealth).
implies(successful_business, wealth).

implies(medication, drowsiness).
implies(sleep_deprivation, drowsiness).

implies(dieting, weight_loss).
implies(illness, weight_loss).

implies(stress, headache).
implies(dehydration, headache).

implies(underwater, inability_to_breathe).
implies(asthma_attack, inability_to_breathe).

implies(reading_books, knowledge).
implies(internet_browsing, knowledge).

implies(cold, runny_nose).
implies(allergies, runny_nose).

implies(running, increased_heart_rate).
implies(fear, increased_heart_rate).

implies(car_accident, injury).
implies(falling_from_height, injury).

strong_improper_transposition(A, B) :- 
    implies(A, B),
    implies(C, B),
    C \= A,
    \+ implies_transitively(A, C),
    \+ implies_transitively(C, A).

implies_transitively(X, Y) :-
    implies(X, Y).
implies_transitively(X, Y) :-
    implies(X, Z),
    implies_transitively(Z, Y).
    
listall_improper_transpositions :-
    strong_improper_transposition(A, B),
    write('Since '), write(A), write(' implies '), write(B),
    write(', therefore '), write(B), write(' implies '), write(A), write('.'),
    nl,
    fail.

happen_at(summer, ice_cream_sales_increase).
happen_at(summer, drowning_deaths_increase).
real_cause(hot_weather, ice_cream_sales_increase).
real_cause(more_swimming_activity, drowning_deaths_increase).

happen_at(rainy_season, umbrella_sales_increase).
happen_at(rainy_season, car_wiper_usage_increase).
real_cause(rain_protection_need, umbrella_sales_increase).
real_cause(driving_visibility_need, car_wiper_usage_increase).

happen_at(winter, coat_sales_increase).
happen_at(winter, heating_bills_increase).
real_cause(cold_weather_protection, coat_sales_increase).
real_cause(home_temperature_maintenance, heating_bills_increase).

happen_at(growing_neighborhood, diaper_sales_increase).
happen_at(growing_neighborhood, birth_rate_increase).
real_cause(existing_babies, diaper_sales_increase).
real_cause(young_family_demographics, birth_rate_increase).

happen_at(night_time, street_light_usage_increase).
happen_at(night_time, crime_rate_increase).
real_cause(darkness, street_light_usage_increase).
real_cause(reduced_visibility, crime_rate_increase).

happen_at(summer, sunglasses_sales_increase).
happen_at(summer, air_conditioner_usage_increase).
real_cause(sun_glare_protection, sunglasses_sales_increase).
real_cause(heat_discomfort, air_conditioner_usage_increase).

happen_at(winter, hot_chocolate_consumption_increase).
happen_at(winter, flu_cases_increase).
real_cause(warmth_comfort, hot_chocolate_consumption_increase).
real_cause(indoor_crowding, flu_cases_increase).

happen_at(summer, barbecue_grill_sales_increase).
happen_at(summer, sunburn_incidents_increase).
real_cause(outdoor_cooking_preference, barbecue_grill_sales_increase).
real_cause(increased_sun_exposure, sunburn_incidents_increase).

happen_at(winter, tire_chain_sales_increase).
happen_at(winter, soup_consumption_increase).
real_cause(snow_road_safety, tire_chain_sales_increase).
real_cause(warm_food_desire, soup_consumption_increase).

happen_at(holiday_season, christmas_tree_sales_increase).
happen_at(holiday_season, gift_wrapping_paper_sales_increase).
real_cause(christmas_tradition, christmas_tree_sales_increase).
real_cause(gift_giving_custom, gift_wrapping_paper_sales_increase).

happen_at(summer, beach_attendance_increase).
happen_at(summer, ice_cream_truck_presence_increase).
real_cause(swimming_recreation, beach_attendance_increase).
real_cause(frozen_treat_demand, ice_cream_truck_presence_increase).

happen_at(rainy_day, umbrella_usage_increase).
happen_at(rainy_day, movie_theater_attendance_increase).
real_cause(rain_protection, umbrella_usage_increase).
real_cause(indoor_entertainment_preference, movie_theater_attendance_increase).

happen_at(winter, fireplace_usage_increase).
happen_at(winter, hot_cocoa_consumption_increase).
real_cause(home_heating_need, fireplace_usage_increase).
real_cause(warm_beverage_preference, hot_cocoa_consumption_increase).

happen_at(flu_season, vitamin_c_sales_increase).
happen_at(flu_season, cold_medicine_sales_increase).
real_cause(immune_support_desire, vitamin_c_sales_increase).
real_cause(symptom_relief_need, cold_medicine_sales_increase).

happen_at(january, gym_membership_signups_increase).
happen_at(january, diet_book_sales_increase).
real_cause(new_year_resolutions, gym_membership_signups_increase).
real_cause(weight_loss_goals, diet_book_sales_increase).

happen_at(snowstorm, snowplow_activity_increase).
happen_at(snowstorm, hot_chocolate_sales_increase).
real_cause(snow_removal_necessity, snowplow_activity_increase).
real_cause(warmth_comfort_desire, hot_chocolate_sales_increase).

happen_at(early_summer, shorts_sales_increase).
happen_at(early_summer, air_conditioner_installations_increase).
real_cause(comfortable_clothing_need, shorts_sales_increase).
real_cause(heat_management_preparation, air_conditioner_installations_increase).

happen_at(autumn, leaf_blower_usage_increase).
happen_at(autumn, pumpkin_sales_increase).
real_cause(fallen_leaf_cleanup, leaf_blower_usage_increase).
real_cause(halloween_decoration_tradition, pumpkin_sales_increase).

happen_at(late_summer, school_supply_sales_increase).
happen_at(late_summer, last_minute_vacation_bookings_increase).
real_cause(back_to_school_preparation, school_supply_sales_increase).
real_cause(end_of_summer_urgency, last_minute_vacation_bookings_increase).

happen_at(independence_day, fireworks_sales_increase).
happen_at(independence_day, emergency_room_visits_increase).
real_cause(celebration_tradition, fireworks_sales_increase).
real_cause(celebration_accidents, emergency_room_visits_increase).

false_cause(Event1, Event2) :-
    happen_at(Season, Event1),
    happen_at(Season, Event2),
    real_cause(Cause2, Event2),
    Cause2 \= Event1, 
    Event1 @< Event2.

list_false_cause_sentences :-
    findall((Season, E1, E2),
            ( false_cause(E1, E2),
              happen_at(Season, E1),
              happen_at(Season, E2)
            ),
            Sentences),
    print_sentences(Sentences).

print_sentences([]).
print_sentences([(Season, E1, E2)|Rest]) :-
    write('Since for '), write(Season),
    write(', '), write(E1),
    write(' happens with '), write(E2),
    write(', then '), write(E1),
    write(' caused '), write(E2), write('.'), nl,
    print_sentences(Rest).