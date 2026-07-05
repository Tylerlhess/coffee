import openai

# Set your OpenAI API key (leave empty as requested)
api_key = ""

# Initialize the client
client = openai.OpenAI(api_key=api_key)

def generate_fallacy_sentences(fallacy_type, list_of_sentences, prolog_facts):
    # Construct the prompt
    prompt = f"""
    Instruction: Generate 20 new {fallacy_type} Prolog knowledge combinations. Study the style of the sentences in the provided list and transform the given Prolog facts into natural language sentences that follow a similar style and structure.
    
    Query:
    List: {list_of_sentences}
    PrologFacts: {prolog_facts}
    """
    
    # Make the API call
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        max_tokens=4000
    )
    
    # Return the generated text
    return response.choices[0].message.content


fallacy_type = ""
list_of_sentences = []
prolog_facts = []

result = generate_fallacy_sentences(fallacy_type, list_of_sentences, prolog_facts)
print(result)