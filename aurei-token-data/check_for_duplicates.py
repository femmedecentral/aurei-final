import os
import sys
import fileinput
from os.path import exists
import json

aurei = {}
duplicate_count = 0

for x in range(1, 888):

    if exists('metadata/' + str(x)):

        # Read in the file
        with open('metadata/' + str(x), 'r') as file :
            aureus_data = json.load(file)
            del aureus_data['name']
            del aureus_data['image']

            json_aureus = json.dumps(aureus_data, indent=4, sort_keys=True)

            aureus_hash = hash(json_aureus)
            if aureus_hash in aurei:
                # print('we found a duplicate!')
                duplicate_count += 1
            else:
                aurei[aureus_hash] = aureus_data

print("total duplicates: " + str(duplicate_count))
