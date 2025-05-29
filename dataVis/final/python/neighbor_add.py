import json

# This file was generated using Perplexity, asking to edit the current ssbu.json file and add an attribute of neighbor count.

# Load the JSON file
with open('data/ssbu.json', 'r') as f:
    data = json.load(f)

# Initialize neighbor counts
neighbor_counts = {node['id']: 0 for node in data['nodes']}

# Count connections from both source and target links
for link in data['links']:
    neighbor_counts[link['source']] += 1
    neighbor_counts[link['target']] += 1

# Add neighborCount to each node
for node in data['nodes']:
    node['neighborCount'] = neighbor_counts[node['id']]

with open('data/ssbu_with_neighbor_counts.json', 'w') as f:
    json.dump(data, f, indent=2)