from multiprocessing.sharedctypes import Value
import random
from random import randint
from PIL import Image 
from IPython.display import display 
import json
import shutil
import copy
import string

"""
Helper functions
"""

# dict to contain all aureus 
aurei = {}
total_aurei = 888 #can't be lower than 10
total_owner_managed = 6

mutant_aurelius =  {
        "background": "default",
        "color": "two-tone",
        "features": {
            "beard": 1,
            "eyes": 'diamond',
            "lower_coins": 1,
            "lower_skeleton": 1,
            "upper_coins": 1,
            "upper_skeleton": 1
        },
        "motto": "illegal_tender",
        "symbol": "Fire",
        "token_id": 1,
        "value": "efficiency"
}

femme_decentral = {
        "background": "default",
        "color": "two-tone",
        "features": {
            "beard": 0,
            "eyes": 0,
            "lower_coins": 0,
            "lower_skeleton": 0,
            "upper_coins": 0,
            "upper_skeleton": 0
        },
        "motto": "None",
        "symbol": "Owl",
        "token_id": total_aurei,
        "value": "Believe. Build."    
}

memento = {
        "background": "default",
        "color": "shadow",
        "features": {
            "beard": 0,
            "eyes": 1,
            "lower_coins": 0,
            "lower_skeleton": 0,
            "upper_coins": 0,
            "upper_skeleton": 0
        },
        "motto": "emeritus",
        "symbol": "Infinity",
        "token_id": "memento",
        "value": "Eternity" 
}

def choose_color():
    coin_flip = randint(1,2)
    if coin_flip == 1:
        return "gold"
    else: return "silver"

def roll_for_traits(is_owner_managed, suit):
    aureus = {}

    background_list = ['default', '1', '2', '3', '4']
    motto_list = ['aurei_numeri', 'illegal_tender', 'manus_adamas', 'pax_numeri', 'vires_in_numeris']
    value_list = ['efficiency', 'integrity', 'purpose']
    symbol_list = ['KF', 'Owl', 'Fire', 'Knife', 'Ruby fire']
    eyes_list = [0, 1, 'diamond', 'emerald', 'ruby']


    # selection logic for features

    #background; default is a lot more common
    aureus['background'] = random.choices(background_list, weights=(80, 5, 5, 5, 5), k=1)[0]
    
    # only two-tone if owner managed
    if is_owner_managed: 
        aureus['color'] = 'two-tone' 
    else: aureus['color'] = choose_color()

    #randomly assign value, motto, and symbol
    aureus['motto'] = random.choices(motto_list, k=1)[0]
    aureus['value'] = random.choices(value_list, k=1)[0]

    if suit == 'random':
        aureus['symbol'] = random.choices(symbol_list, weights=(25, 25, 25, 20, 5), k=1)[0]
    else:
        aureus['symbol'] = suit

    # select features
    aureus['features'] = {}
    aureus['features']['eyes'] = random.choices(eyes_list, weights=(37.5, 37.5, 5, 10, 10), k=1)[0]
    aureus['features']['beard'] = randint(0,1)
    aureus['features']['upper_coins'] = randint(0,1)
    aureus['features']['lower_coins'] = randint(0,1)
    aureus['features']['upper_skeleton'] = randint(0,1)
    aureus['features']['lower_skeleton'] = randint(0,1)

    # check if skeletons + silver, are they bone?
    if aureus['color'] == 'silver':
        if aureus['features']['upper_skeleton']:
            if random.randrange(100) > 75: aureus['features']['upper_skeleton'] = 'bone'
        if aureus['features']['lower_skeleton']:
            if random.randrange(100) > 75: aureus['features']['lower_skeleton'] = 'bone'

    return aureus

def create_profile_with_features(aureus, base_color):
    combined_profile_image = Image.open(f'./layers/base/{base_color}.png').convert('RGBA')

    for feature in aureus['features']:
        print(aureus['features'][feature])
        if aureus['features'][feature] == 1:
            feature_image = Image.open(f'./layers/features/{feature}/{base_color}.png').convert('RGBA')
            combined_profile_image = Image.alpha_composite(combined_profile_image, feature_image)
        elif aureus['features'][feature] != 0:
            print(feature)
            feature_image = Image.open(f'./layers/features/{feature}/{aureus["features"][feature]}.png').convert('RGBA')
            combined_profile_image = Image.alpha_composite(combined_profile_image, feature_image)

    return combined_profile_image

# create the image for the token given a dict of the token properties

def create_token_image(aureus):

    # openning all the files

    #background
    background_image = Image.open(f'./layers/backgrounds/{aureus["background"]}.png').convert('RGBA')

    eyes_image = None
    if aureus['color'] == 'two-tone':
        coin_image = Image.open(f'./layers/coin/silver.png').convert('RGBA')
        value_image = Image.open(f'./layers/value/{aureus["value"]}/gold.png').convert('RGBA')
        motto_image = Image.open(f'./layers/motto/{aureus["motto"]}/gold.png').convert('RGBA')
        symbol_image = Image.open(f'./layers/symbol/{aureus["symbol"]}/gold.png').convert('RGBA')
        features_image = create_profile_with_features(aureus, 'gold')
    else:
        coin_image = Image.open(f'./layers/coin/{aureus["color"]}.png').convert('RGBA')
        value_image = Image.open(f'./layers/value/{aureus["value"]}/{aureus["color"]}.png').convert('RGBA')    
        motto_image = Image.open(f'./layers/motto/{aureus["motto"]}/{aureus["color"]}.png').convert('RGBA')
        symbol_image = Image.open(f'./layers/symbol/{aureus["symbol"]}/{aureus["color"]}.png').convert('RGBA')
        features_image = create_profile_with_features(aureus, aureus['color'])

    # stacking all the files in order
    final_image = Image.alpha_composite(background_image, coin_image)
    final_image = Image.alpha_composite(final_image, value_image)
    final_image = Image.alpha_composite(final_image, motto_image)
    final_image = Image.alpha_composite(final_image, symbol_image)
    final_image = Image.alpha_composite(final_image, features_image)

    rgb_im = final_image.convert('RGB')
    rgb_im.save('./images/' + f'{aureus["token_id"]}.png')

def create_aureus(aureus, token_id, aureus_hash):
    aureus['token_id'] = token_id
    aurei[aureus_hash] = aureus
    create_token_image(aureus)

def create_hash(aureus):
    json_aureus = json.dumps(aureus, indent=4, sort_keys=True)
    return hash(json_aureus)

def generate_coins():

    token_id = 1

    # create canonical and owner-managed coins
    # 2 canonical
    # 6 owner managed: 1 owl, 1 knife, 2 ruby fire, 2 KF
    # I could check for uniqueness for the owner-managed coins, but given the low number, not going to bother
    
    # create canonical mutant aurelius
    create_aureus(mutant_aurelius, token_id, create_hash(mutant_aurelius))

    #create canonical femme decentral; can't use regular create_aureus because image is fixed
    femme_hash = create_hash(femme_decentral)
    aurei[femme_hash] = femme_decentral
    # copy femme_decentral image into the right folder with the right filename
    shutil.copyfile('./layers/azuki/femme_decentral.png', f'./images/{femme_decentral["token_id"]}.png')

    #create mementos
    memento_hash = create_hash(memento)
    aurei[memento_hash] = memento
    shutil.copyfile('./layers/memento/memento.png', f'./images/{memento["token_id"]}.png')

    # create 6 owner managed
    aureus = roll_for_traits(True, 'Owl')
    token_id += 1
    create_aureus(aureus, token_id, create_hash(aureus))
    aureus = roll_for_traits(True, 'Knife')
    token_id += 1
    create_aureus(aureus, token_id, create_hash(aureus))
    for x in range(2):
        aureus = roll_for_traits(True, 'Ruby fire')
        token_id += 1
        create_aureus(aureus, token_id, create_hash(aureus))
    for x in range(2):
        aureus = roll_for_traits(True, 'KF')
        token_id += 1
        create_aureus(aureus, token_id, create_hash(aureus))

    token_id += 1

    # pick token IDs that are not owner managed / canonical on either end to be replaced by femme coins
    gold_femme_id = randint(total_owner_managed+2,total_aurei-1)
    silver_femme_id = randint(total_owner_managed+2,total_aurei-1)
    while gold_femme_id == silver_femme_id:
        silver_femme_id = randint(total_owner_managed+2,total_aurei-1)

    print(gold_femme_id)
    print(silver_femme_id)

    # create the rest of the collection
    print("token ID")
    print(token_id)
    

    #TODO rename aurei
    while(token_id < total_aurei):
    # for x in range(total_owner_managed+2, total_aurei):

        print("tokenID: " + str(token_id))
        if token_id == gold_femme_id:
            print('in gold')
            shutil.copyfile('./layers/azuki/gold.png', f'./images/{gold_femme_id}.png')
            gold_femme = copy.deepcopy(femme_decentral)
            gold_femme['color'] = 'gold'
            gold_femme['token_id'] = gold_femme_id
            gold_femme_hash = create_hash(gold_femme)
            aurei[gold_femme_hash] = gold_femme
            token_id += 1
        elif token_id == silver_femme_id:
            print('in silver')
            shutil.copyfile('./layers/azuki/silver.png', f'./images/{silver_femme_id}.png')
            silver_femme = copy.deepcopy(femme_decentral)
            silver_femme['color'] = 'silver'
            silver_femme['token_id'] = silver_femme_id
            silver_femme_hash = create_hash(silver_femme)
            aurei[silver_femme_hash] = silver_femme
            token_id += 1
        else:
            aureus = roll_for_traits(False, 'random')

            # to ensure uniqueness, we create a hash of the feautures
            # dicts can't be hashed, so we translate into json first, then hash the sorted json
            json_aureus = json.dumps(aureus, indent=4, sort_keys=True)
            aureus_hash = hash(json_aureus)
            if aureus_hash in aurei:
                print('we found a duplicate!')
            else:
                print("tokenid regular:" + str(token_id))
                aureus['token_id'] = token_id
                aurei[aureus_hash] = aureus
                create_token_image(aureus)
                token_id += 1



    


"""
Takes the raw dict of all aurei and turns it into the metadata json format that works for 
NFT exchanges, and writes it's own file ready to be uploaded. 

https://docs.opensea.io/docs/metadata-standards

e.g. 

{
  "description": "Friendly OpenSea Creature that enjoys long swims in the ocean.", 
  "external_url": "https://openseacreatures.io/3", 
  "image": "https://storage.googleapis.com/opensea-prod.appspot.com/puffs/3.png", 
  "name": "Dave Starbelly",
  "attributes": [ {
      "trait_type": "Base", 
      "value": "Starfish"
    }, 
    {
      "trait_type": "Eyes", 
      "value": "Big"
    }], 
}

"""

def pretty_print_background(background_value):
    if background_value == 'default':
        return "Spotlight"
    elif background_value == '1':
        return "Golden Sunset"
    elif background_value == '2':
        return "Fire Sunset"
    elif background_value == '3':
        return "Rainbow Sunset"
    else:
        return "City Lights Sunset"
    
def pretty_print_motto(motto_value):
    if motto_value == 'aurei_numeri':
        return "AUREI NUMERI"
    elif motto_value == 'illegal_tender':
        return "ILLEGAL TENDER"
    elif motto_value == 'manus_adamas':
        return "MANUS ADAMAS"
    elif motto_value == 'pax_numeri':
        return "PAX NUMERI"
    elif motto_value == 'vires_in_numeris':
        return "VIRES IN NUMERIS"
    elif motto_value == 'None':
        return "None"
    elif motto_value == "emeritus":
        return "AURELIUS EMERITUS"
    else:
        print("pretty print motto exception")
        

def pretty_print_feature_color(color):
    if color == 'two-tone':
        return "Gold"
    elif color == 'gold': 
        return "Gold"
    elif color == 'silver':
        return "Silver"
    elif color == 'shadow':
        return "Shadow"
    else:
        print('pretty print color exception')


def generate_metadata():

    # iterate through each aureus to construct the json and then create the file
    for aureus_key in aurei:

        # get the defintiion of this aureus's traits
        aureus_traits = aurei[aureus_key]

        #create new dict for each aureus
        aureus_metadata = {}

        token_id = aureus_traits['token_id']

        # Generate descriptions (no standardized markup across marketplaces, so just plaintext)
        if token_id == 1:
            aureus_metadata['description'] = "You’re the best thing that’s ever happened to me. <3, @femmedecentral"
        elif token_id == total_aurei:
            aureus_metadata['description'] = "This is your first NFT. Congrats! May you always remember this fondly. <3, @femmedecentral"
        elif token_id == 'memento':
            aureus_metadata['description'] = "A token of remembrance given to those who once held office on the Small Council of Mutant Aurelius."
        elif token_id > 1 and token_id <= 7:
            aureus_metadata['description'] = "The holder of this coin sits on the Small Council of the Philosopher King Mutant Aurelius. The coin belongs not to you, but to the office itself. You cannot transfer or sell it. When you have completed your service the coin will move to your successor. You will receive a Memento of your time in the sun. Blessings of Empire."
        elif aureus_traits['value'] == 'Believe. Build.':
            aureus_metadata['description'] = "Wait, what? What is this coin? Surprised? Or just lucky? @femmedecentral left you this gift. It’s special. Think of this as an Aureus, but with a little extra zazz."
        else:
            aureus_metadata['description'] = "A Mutant Aureus, coin of the realm, held exclusively by those rich in both wisdom and spirit."

        aureus_metadata['image'] = "ipfs://loremipsum/" + str(token_id) + ".png"

        if token_id == 'memento':
            aureus_metadata['name'] = "Memento"
        else:
            aureus_metadata['name'] = "Aureus #" + str(token_id)

        # iterate through traits
        aureus_metadata['attributes'] = []
        aureus_metadata['attributes'].append({'trait_type' : 'Background', 'value' : pretty_print_background(aureus_traits['background'])})
        aureus_metadata['attributes'].append({'trait_type' : 'Coin color', 'value' : aureus_traits['color'].capitalize()})
        aureus_metadata['attributes'].append({'trait_type' : 'Motto', 'value' : pretty_print_motto(aureus_traits['motto'])})
        aureus_metadata['attributes'].append({'trait_type' : 'Symbol', 'value' : aureus_traits['symbol']})
        aureus_metadata['attributes'].append({'trait_type' : 'Value', 'value' : aureus_traits['value'].title()})
        
        # special casing of present / not present / speciality value features

        # beard
        if aureus_traits['features']['beard'] == 1:
            aureus_metadata['attributes'].append({'trait_type' : 'Beard', 'value' : pretty_print_feature_color(aureus_traits['color'])})
        else: 
            aureus_metadata['attributes'].append({'trait_type' : 'Beard', 'value' : 'None'})

        # eyes
        if aureus_traits['features']['eyes'] == 1:
            aureus_metadata['attributes'].append({'trait_type' : 'Eyes', 'value' : pretty_print_feature_color(aureus_traits['color'])})
        elif aureus_traits['features']['eyes'] == 0:
            aureus_metadata['attributes'].append({'trait_type' : 'Eyes', 'value' : 'None'})
        else: 
            aureus_metadata['attributes'].append({'trait_type' : 'Eyes', 'value' : aureus_traits['features']['eyes'].capitalize()})

        # upper coins
        if aureus_traits['features']['upper_coins'] == 1:
            aureus_metadata['attributes'].append({'trait_type' : 'Mohawk', 'value' : pretty_print_feature_color(aureus_traits['color'])})
        else: 
            aureus_metadata['attributes'].append({'trait_type' : 'Mohawk', 'value' : 'None'})

        # lower coins
        if aureus_traits['features']['lower_coins'] == 1:
            aureus_metadata['attributes'].append({'trait_type' : 'Shoulders', 'value' : pretty_print_feature_color(aureus_traits['color'])})
        else: 
            aureus_metadata['attributes'].append({'trait_type' : 'Shoulders', 'value' : 'None'})

        # upper skeleton 
        if aureus_traits['features']['upper_skeleton'] == 1:
            aureus_metadata['attributes'].append({'trait_type' : 'Upper Skeleton', 'value' : pretty_print_feature_color(aureus_traits['color'])})
        elif aureus_traits['features']['upper_skeleton'] == 0:
            aureus_metadata['attributes'].append({'trait_type' : 'Upper Skeleton', 'value' : 'None'})
        else: 
            aureus_metadata['attributes'].append({'trait_type' : 'Upper Skeleton', 'value' : 'Bone'})

        # lower skeleton
        if aureus_traits['features']['lower_skeleton'] == 1:
            aureus_metadata['attributes'].append({'trait_type' : 'Lower Skeleton', 'value' : pretty_print_feature_color(aureus_traits['color'])})
        elif aureus_traits['features']['lower_skeleton'] == 0:
            aureus_metadata['attributes'].append({'trait_type' : 'Lower Skeleton', 'value' : 'None'})
        else: 
            aureus_metadata['attributes'].append({'trait_type' : 'Lower Skeletom', 'value' : 'Bone'})

        # create a separate JSON file named for the token #
        with open('metadata/' + str(token_id), 'w') as f:
            f.write(json.dumps(aureus_metadata, indent=4))


"""
Run scripts
"""

generate_coins()  
generate_metadata()

