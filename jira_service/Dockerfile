FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Copy application files to the container
COPY . /app

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Disable output buffering
ENV PYTHONUNBUFFERED=1

# Command to run the application
CMD ["python", "app.py"]
