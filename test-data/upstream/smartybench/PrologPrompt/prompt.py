import requests
import json
import os
import time

# API configuration
API_KEY = "YOUR_API_KEY_HERE"  # Replace with actual API key
BASE_URL = "https://api.anthropic.com/v1/messages"
MODEL = "claude-3-7-sonnet-20250219"  # Using Claude 3.7 extended API model

# Define prompts for each fallacy type with comments removed
improper_transposition = """
implies(rainy_days, wet_ground).
implies(sprinklers_on, wet_ground).
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
"""

false_cause = """
happen_at(summer, ice_cream_sales_increase).
happen_at(summer, crime_rate_increase).
real_cause(summer, ice_cream_sales_increase).
real_cause(summer, crime_rate_increase).
false_cause(Event1, Event2) :-
happen_at(Season, Event1),
happen_at(Season, Event2),
real_cause(Cause2, Event2),
Cause2 \= Event1,
Event1 @< Event2.
"""

wrong_direction = """
cause(meteor, crater).
cause(move_eye_close_to_mirror, mirror_looks_like_eye).
only_cause(X, Y) :-
cause(X, Y),
\+ (cause(Z, Y), Z \= X).
false_cause(P, Q) :-
only_cause(Q, P),
\+ cause(P, Q).
"""

inverse_error = """
complement_cases(has_flu, not_has_flu).
complement_cases(has_fever, not_has_fever).
implies(has_flu, has_fever).
\+ implies(has_fever, has_flu).
inverse_error(D, E) :-
complement_cases(A,D),
complement_cases(B,E),
implies(A, B),
\+ implies(B, A).
"""

accident_fallacy = """
has_rule(shampoo_bottle, lather_rinse_repeat).
rule_unreasonble_interpretation(lather_rinse_repeat, infinite_washing).
rule_reasonable_interpretation(lather_rinse_repeat, wash_once_or_twice).
accident_fallacy(Entity, Rule, Reasonable, Misapplied) :-
has_rule(Entity, Rule),
rule_reasonable_interpretation(Rule, Reasonable),
rule_unreasonble_interpretation(Rule, Misapplied),
Reasonable \= Misapplied.
"""

false_analogy = """
incorporate(kidney, kid_word).
incorporate(kid, kid_word).
incorporate(kid, grow_into_adult).
false_analogy(Q, Y) :-
incorporate(P, X),
incorporate(Q, X),
\+ incorporate(P, Y),
Q @< Y.
"""

improper_dist = """
has_effect(brush_teeth, 2_mins, teeth_health_for_that_day).
has_effect(brush_teeth, 14_mins, teeth_health_for_one_week).
valid_accmulate(2_mins, repeat_7_times_in_one_go, 14_mins).
\+ valid_accmulate(teeth_health_for_that_day, repeat_7_times_in_one_go, teeth_health_for_one_week).
improper_dist(A,B,C,D) :-
has_effect(E,A,C),
has_effect(E,B,D),
valid_accmulate(A,F,B),
\+ valid_accmulate(C,F,D).
"""

fallacy_of_composition = """
has_property(chimney, survives_fire).
is_part_of(chimney, building).
lacks_property(building, survives_fire).
fallacy_of_composition(Component, Property, Whole) :-
has_property(Component, Property),
is_part_of(Component, Whole),
lacks_property(Whole, Property).
"""

contextomy = """
quote_context(time_is_money, time_is_valuable_just_like_money).
quote_out_of_context(time_is_money, time_is_literally_money).
fact_related_out_of_context(time_is_literally_money, third_world_countries_have_less_money).
improper_fact_quote_out_of_context(third_world_countries_have_less_money, time_is_slower_in_third_world_countries).
contextomy(A, B) :-
quote_context(A, C),
quote_out_of_context(A, D),
fact_related_out_of_context(D, F),
improper_fact_quote_out_of_context(F, B).
"""

false_premise = """
established_fact(people_has_two_lungs, two_lungs_breathe_out_carbon_dioxide).
false_premise(two_lungs_breathe_out_carbon_dioxide, lung_number_influence_carbon_number).
plausible_observation(people_can_have_one_lung, lung_number_influence_carbon_number).
false_premise_lead_conclusion(lung_number_influence_carbon_number, people_can_have_one_lung, one_lung_breahte_out_carbon_monoxide).
false_premise(FactCondition, FactResult, FalsePremise, ValidObservation, FalsePremiseConclusion) :-
established_fact(FactCondition, FactResult),
false_premise(FactResult, FalsePremise),
plausible_observation(ValidObservation, FalsePremise),
false_premise_lead_conclusion(FalsePremise, ValidObservation, FalsePremiseConclusion).
"""

begging_the_question = """
claim_and_argument(bible_true, bible_word_of_god).
explicit_meaning_of_argument(bible_word_of_god, bible_says_god_exists).
explcit_meaning_rely_on_claim(bible_says_god_exists, bible_true).
begging_the_question(A, B) :-
claim_and_argument(A, B),
explicit_meaning_of_argument(B, C),
explcit_meaning_rely_on_claim(C, A).
"""

# Function to call Claude 3.7 Extended API
def call_claude_api(prompt):
    headers = {
        "x-api-key": API_KEY,
        "content-type": "application/json",
        "anthropic-version": "2023-06-01"
    }
    
    data = {
        "model": MODEL,
        "max_tokens": 4000,
        "temperature": 0.7,
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }
    
    response = requests.post(BASE_URL, headers=headers, data=json.dumps(data))
    
    if response.status_code == 200:
        return response.json()["content"][0]["text"]
    else:
        return f"Error: {response.status_code}, {response.text}"

# Generate examples for each fallacy
def generate_examples(fallacy_name, prolog_knowledge):
    prompt = f"Generate 20 new {fallacy_name} Prolog knowledge combinations,below are examples \n\n{prolog_knowledge}"
    return call_claude_api(prompt)

# Main function to generate all examples and save to file
def main():
    fallacies = {
        "improper_transposition": improper_transposition,
        "false_cause": false_cause,
        "wrong_direction": wrong_direction,
        "inverse_error": inverse_error,
        "accident_fallacy": accident_fallacy,
        "false_analogy": false_analogy,
        "improper_dist": improper_dist,
        "fallacy_of_composition": fallacy_of_composition,
        "contextomy": contextomy,
        "false_premise": false_premise,
        "begging_the_question": begging_the_question
    }
    
    results = {}
    
    for fallacy_name, prolog_knowledge in fallacies.items():
        print(f"Generating examples for {fallacy_name}...")
        result = generate_examples(fallacy_name, prolog_knowledge)
        results[fallacy_name] = result
        
        # Save individual result to file
        with open(f"{fallacy_name}_examples.txt", "w") as f:
            f.write(result)
        
        # Wait a bit between API calls to avoid rate limiting
        time.sleep(2)
    
    # Save all results to a single file
    with open("all_fallacy_examples.txt", "w") as f:
        for fallacy_name, result in results.items():
            f.write(f"=== {fallacy_name.upper()} ===\n\n")
            f.write(result)
            f.write("\n\n")

if __name__ == "__main__":
    main()