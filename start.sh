docker stop dissector
docker rm dissector
docker build -t dissector .
docker run -d --name dissector -p 20128:20128 --env-file .env -v dissector-data:/app/data dissector