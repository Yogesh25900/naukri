import sys
import spacy
import json

# Load the spaCy NLP model
nlp = spacy.load('en_core_web_sm')

# List of common skills (this can be expanded or loaded from a dataset)
skills = ['Python', 'Java', 'JavaScript', 'C++', 'SQL', 'Machine Learning', 'Data Science', 'HTML', 'CSS', 'AWS', 'Docker']

# Function to extract skills from a CV text
def extract_skills(text):
    doc = nlp(text)
    extracted_skills = set()

    # Look for matches to common skills
    for token in doc:
        if token.text in skills:
            extracted_skills.add(token.text)
    
    return list(extracted_skills)

# Main execution
if __name__ == "__main__":
    resume_path = sys.argv[1]
    
    # Read the uploaded resume file
    with open(resume_path, 'r') as file:
        resume_text = file.read()
    
    # Extract skills from the resume
    skills = extract_skills(resume_text)
    
    # Dummy job recommendation based on skills
    recommended_jobs = [
        {'job_title': 'Software Engineer', 'job_description': 'Develop and maintain software applications', 'matching_skills': skills},
        {'job_title': 'Data Scientist', 'job_description': 'Analyze data and build predictive models', 'matching_skills': skills}
    ]

    # Return recommended jobs as JSON
    print(json.dumps(recommended_jobs))
