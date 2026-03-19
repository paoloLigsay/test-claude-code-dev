import os

from google import genai

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])


def generate(prompt: str, content: str, model_name: str = "gemini-2.5-flash") -> str:
    response = client.models.generate_content(
        model=model_name,
        contents=f"{prompt}\n\n---\n\n{content}",
    )
    return response.text
