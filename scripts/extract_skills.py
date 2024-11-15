import sys
import fitz  # PyMuPDF for PDF extraction
import spacy
from transformers import pipeline
import json
import warnings

warnings.filterwarnings("ignore", category=UserWarning, module="transformers")

# Load spaCy's English model for general NLP tasks
nlp_spacy = spacy.load("en_core_web_sm")

# Load Hugging Face's NER pipeline for skill extraction
nlp_hf = pipeline("ner", model="dslim/bert-base-NER")  # Replace with a job-focused NER model if available

# Predefined skill set to enhance skill matching
skill_set = {
    "Python", "Java", "Machine Learning", "Deep Learning", "Data Science", "SQL",
    "JavaScript", "Project Management", "Communication", "Leadership", "React",
    "Django", "Flask", "TensorFlow", "Keras", "Pandas", "NumPy", "C++", "C#",
    "HTML", "CSS", "AWS", "Azure", "Docker", "Kubernetes", "Tableau", "Power BI"
}

def extract_text_from_pdf(pdf_path):
    """ Extracts text from each page of the PDF. """
    text = ""
    with fitz.open(pdf_path) as pdf:
        for page in pdf:
            text += page.get_text("text")
    return text

def extract_skills_with_spacy(text):
    """ Extracts skills using spaCy and a predefined skill set. """
    doc = nlp_spacy(text)
    extracted_skills = set()

    for token in doc:
        # Match exact predefined skills
        if token.text in skill_set:
            extracted_skills.add(token.text)

    for chunk in doc.noun_chunks:
        # Match predefined skills in noun chunks
        if chunk.text in skill_set:
            extracted_skills.add(chunk.text)

    return extracted_skills

def extract_skills_with_huggingface(text):
    """ Extracts skills using a Hugging Face NER model. """
    entities = nlp_hf(text)
    extracted_skills = set()

    for entity in entities:
        # Filter specific entities like "B-ORG" and match predefined skills
        if entity["entity"] in {"B-ORG", "I-ORG"} and entity["word"] in skill_set:
            extracted_skills.add(entity["word"])

    return extracted_skills

def parse_resume(pdf_path):
    """ Main function to load resume, extract text, and identify skills """
    resume_text = extract_text_from_pdf(pdf_path)

    # Extract skills from predefined set and NER
    skills_spacy = extract_skills_with_spacy(resume_text)
    skills_hf = extract_skills_with_huggingface(resume_text)
    
    # Combine and deduplicate skills from both methods
    all_skills = skills_spacy.union(skills_hf)
    
    # Filter irrelevant words (e.g., short or overly generic ones)
    filtered_skills = {skill for skill in all_skills if len(skill) > 2 and skill.isalpha()}

    return {
        "skills": list(filtered_skills),  # Convert to list for JSON serialization
        # "resume_text": resume_text
    }

# Example usage
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract_skills.py <resume_path>")
        sys.exit(1)

    pdf_path = sys.argv[1]
    try:
        parsed_resume = parse_resume(pdf_path)
        # Return extracted skills as JSON
        print(json.dumps(parsed_resume))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
