import os
import sys
import fileinput
from os.path import exists

new_CID = 'QmWttXGF3KP2aRCzqfWc1Dax7nTVbhef49E7dKgS3jPiwu'
old_CID = 'loremipsum'

for x in range(1, 888):

    if exists('metadata/' + str(x)):

        # Read in the file
        with open('metadata/' + str(x), 'r') as file :
            filedata = file.read()

        # Replace the target string
        filedata = filedata.replace(old_CID, new_CID)

        # Write the file out again
        with open('metadata/' + str(x), 'w') as file:
            file.write(filedata)

# Read in the file
with open('metadata/memento', 'r') as file :
    filedata = file.read()

# Replace the target string
filedata = filedata.replace(old_CID, new_CID)

# Write the file out again
with open('metadata/memento', 'w') as file:
    file.write(filedata)