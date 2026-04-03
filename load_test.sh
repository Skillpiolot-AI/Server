#!/bin/bash
# Load test script
echo "Starting load test: 5,000 req/sec for 10 seconds..."
npx autocannon -c 100 -d 10 -r 5000 --json > load_test_results.json http://localhost:3001/health
npx autocannon -c 100 -d 10 -r 5000 http://localhost:3001/health > load_test_summary.txt
echo "Load test complete. Results saved to load_test_results.json and load_test_summary.txt"
