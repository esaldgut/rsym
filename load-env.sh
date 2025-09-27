#!/bin/bash
# Cargar variables de .env.local a Copilot
while IFS='=' read -r key value; do
  if [[ ! -z "$key" && ! "$key" =~ ^# ]]; then
    copilot secret init --name "$key" --overwrite <<< "$value"
  fi
done < .env.local
