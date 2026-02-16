-- Seed: Sablewood location (official Daggerheart content)
-- Source: https://www.daggerheart.com/wp-content/uploads/2025/05/Sablewood-05-20-25.pdf
-- Designed by Spenser Starke & Rowan Hall

INSERT INTO daggerheart_locations (
  name, tier, themes, concept, description,
  distinctions, gm_principles, landmarks, settlements, factions,
  moments_of_hope, moments_of_fear, rumors,
  loot, adversaries, environments,
  source_book
) VALUES (
  -- Core identity
  'Sablewood',
  1,
  ARRAY['Verdant', 'Serene', 'Ancient'],
  'A dense forest known for its bustling economy and hybrid animals.',
  'The Sablewood is an ancient, expansive forest of trees that reach hundreds of feet into the air. Rumored to be older than the Forgotten Gods, this dense wood is widely known throughout the Mortal Realm, and many who visit are surprised to learn that the stories they believed were exaggerated legends are, in fact, stark truths.',

  -- distinctions
  '[
    {
      "name": "Endless Verdance",
      "description": "As far as the eye can see in all directions, and farther still, there is an endless verdancy. The canopy is so thick that, often, travelers cannot tell if it is day or night, and must be careful not to lose their path. Anyone that moves through the treetops could easily make it from one edge of the Sablewood to the other without touching the forest floor. The soil of the Sablewood is notoriously dark and fertile, and though it is a dangerous place, it is the welcome home of a number of communities and creatures.",
      "you_might_find": [
        "An entire village taken over by Hunting Trees in the night, now abandoned.",
        "The deafening whispers of a thousand leaves rustling in the wind.",
        "The scent of sweet honey-like sap leaking from between the cracks of a sablewood tree."
      ]
    },
    {
      "name": "Hybrid Fauna",
      "description": "The fauna of the Sablewood are never quite what unseasoned travelers expect. Always a blend of two familiar beasts, or even animals and elements, they operate in unfamiliar ways. These creatures range from docile and friendly to territorial and aggressive. Many are larger than might be expected, by virtue of their profoundly long lives. Some say the animals that live within the Sablewood are the emissaries of the Forgotten Gods.",
      "you_might_find": [
        "Tiny cat-squirrels jumping from limb to limb as massive giraffe-deer move gingerly along the forest floor.",
        "The hooting-howl of strixwolves calling in the night.",
        "The whoosh of air passing over you as a lemur-toad swings by in the darkness."
      ]
    },
    {
      "name": "The Spires",
      "description": "Within the Sablewood there are a number of Spires with attendants that take up the position any time the previous tower tender dies, causing their signal fire to extinguish. To become a Spire Keeper, one must run through the woods, off all known paths, and make it to the unattended Spire to light the signal fire. No one knows the true job of these Keepers, only that someone must always reside in each tower within the forest.",
      "you_might_find": [
        "Twisting towers of stone that reach beyond the canopy of the Sablewood.",
        "The soft clatter of Spire stones falling from great heights to rest among the undergrowth.",
        "The ozone smell of powerful magic."
      ]
    },
    {
      "name": "Well-Worn Pathways",
      "description": "The pathways of the Sablewood are worn so deep that they are sunken into the rich soil of the forest undergrowth. People who live on the edge of the woods will warn travelers not to leave the paths, as those who do never return and their bodies are never found. Maps leading through the Sablewood are handed down through generations and are quite costly to acquire.",
      "you_might_find": [
        "New travelers walking with their heads and eyes down, while experienced merchants whistle common tunes.",
        "The creak of wooden cart wheels passing over packed dirt.",
        "The smell of campfire as strangers crowd together to scare away the darkness."
      ]
    },
    {
      "name": "Underroot",
      "description": "Because the surface of the uninhabited Sablewood is dangerous, many people choose to live in the network of subterranean tunnels carved in and among the roots of the Sablewood trees. Each community keeps the entrance to their underground home secret, and many maps leading to Underroot communities are coded.",
      "you_might_find": [
        "Winding stairways and tunnels, lit only by faerie lights.",
        "Raucous laughter over meals shared with small communities.",
        "The acrid scent of roots and herbs brewing over a fire."
      ]
    }
  ]'::jsonb,

  -- gm_principles
  '[
    {
      "title": "Make the world lush, vibrant, and awe-inspiring.",
      "description": "The wood is full of life in all forms, every corner occupied by strange and unusual creatures. That which is terrifying is also beautiful and though the risk is high, the Sablewood may offer incredible reward."
    },
    {
      "title": "Show how the natural and the fabricated interact.",
      "description": "Travelers must adapt to the wood, it does not adapt to them. Those who live in the Sablewood must learn the rhythms of the trees and animals. In the end, foresight and cleverness beat out brute force every time."
    },
    {
      "title": "Put the power of nature on full display.",
      "description": "Nature knows no good nor evil, only need. The Sablewood is too long established to bow to any power but that of the Forgotten Gods. There is neither guile nor guilt, no blow withheld, or storm corralled."
    }
  ]'::jsonb,

  -- landmarks
  '[
    {
      "name": "The Titan''s Steps",
      "description": "Stories say that in the time of the Earliest Age, there was a fight between the Old and the New gods in the place where the Sablewood now grows. During this battle, numerous portions of the Mortal Realm were razed, and others were crafted afresh. One such craft is known as the Titan''s Steps, or the Pillars of the Sablewood, that stand within the forest at a variety of incredible heights. Some say one of the Forgotten Gods was foiled in an attempt to create a stairway leading to the Hallows Above. The rocky cliffs of the formation stop neither plants nor creatures from climbing their height. Wooden structures old and new cling to the rock with nets strung between pillars like cobwebs, while flying creatures and massive beasts hunt within the reaches.",
      "details": {
        "Height of the Highest Pillar": "1,189 vertical feet",
        "Number of Bridges Built Between the Pillars": "562"
      },
      "you_might_find": [],
      "sub_features": [
        {
          "name": "Duskwatch Outpost",
          "description": "One of the many encampments hanging from the edges of the Titan''s Steps. This outpost is known to be the largest and easiest to reach, due to a network of bridges and steps that are reasonably well maintained (if you know which planks to avoid.) Within the economy of the Steps, Duskwatch serves as the primary market for merchants willing to travel from the Sablewood below. There is a rumor that the Duskwatch Outpost is establishing a militia, though for what purpose, no one will say."
        },
        {
          "name": "Mountain Crabs",
          "description": "Many people who''ve climbed the pillars have been killed before they even knew what got them. Sometimes confused as rock fall when they awaken, the giant Mountain Crabs are a unique hybrid of crustacean and stone that camouflage themselves with their unique gray shells. They can be small enough to carry, or as large as a building, and will continue to grow until they are killed. These massive hunters move with incredible speed and adventurers must listen for the clicking of their steps over rock."
        },
        {
          "name": "The Catcher''s Cradles",
          "description": "Many of the Step communities craft nets they call \"the catcher''s cradle\" below their buildings and walkways as a last resort for those who misstep or fall through a rotten plank. Rain and age causes rope to deteriorate, and flying creatures tear through the fibers when caught, mending the nets is a constant chore. Some communities string nets between the pillars specifically to trap birds and other animals to eat, and among those groups there is an entire economy built around the buying and selling of strongly crafted rope and the materials required to make it. Sablewood custom dictates that anyone who falls off a walkway into a net pay for its repair in order to pay forward the lifesaving presence of such a tool."
        }
      ]
    },
    {
      "name": "The Lucent River",
      "description": "The Lucent River cuts a luminous ribbon through the Sablewood, at parts deep and clear and other parts rocky and tumultuous. It is the primary source of fresh water in the area, and may be one of the key reasons the trees and plants grow so lushly. The common mythology of the Sablewood describes the river as the everflowing tears of the Forgotten Gods, and once their true names are remembered the river will run dry. The waters of this river are famed for their healing ability, likely due to their moonglow. The alchemists of Root''s Hollow brave dangerous portions of the wood to access the regenerative waters. In distant regions Lucent Water sells for incredible sums.",
      "details": {
        "Common Modes of Transportation": "Riverboats, many of which employ craymeleon (a chameleon-crayfish hybrid with large claws) to pull their vessels by scurrying along the shore or underneath the surface.",
        "River''s Nickname": "Lucy"
      },
      "you_might_find": [],
      "sub_features": [
        {
          "name": "Moonglow",
          "description": "The Lucent River is so named for the soft blue glow it gives off when the moon rises, though the moon itself is barely visible through the canopy above. This feature allows travelers to navigate by night and is an excellent means for keeping time when the sun and the moon are not discernable through the trees. The water of the Lucent River keeps its moonglow, even when removed and placed in other containers or stored underground. Some say it will continue to glow if transported to other realms."
        },
        {
          "name": "Eeligators",
          "description": "The largest predator in the Lucent River is the eeligator. They sleep in the deepest portions of the river, but can travel both in the water and on the shore, making them a ferocious predator to combat. They have slick skin covered in a number of spots that can be used to indicate their age, if the swimmer could survive long enough to calculate. The large eggs of the eeligator are a delicacy in some portions of the Sablewood."
        },
        {
          "name": "The High Falls",
          "description": "In the mountains of the Sablewood, the Lucent River transforms from a small stream into the cascade that creates the massive High Falls. This waterfall is formed by an incredible drop that, when examined, covers a large cave system that shows evidence of once having been a home to a large community, though no one knows why it was abandoned. Directly behind the High Falls there is a massive cavern with nothing but a carved stone throne. Moss covers an illegible series of symbols and an ancient blood stain decorates the cave floor."
        }
      ]
    },
    {
      "name": "Open Vale",
      "description": "A perfect clearing within the middle of the Sablewood; no one knows why the trees will not grow here. It is covered in a layer of particularly lush grass and receives complete sun, in comparison to the rest of the thick forest. This meadow is resistant to farming efforts, and those plants that manage to thrive grow in their own seasonal patterns. The Open Vale is the site of numerous spiritual rituals, performed by a variety of communities that live in and around the Sablewood. \"The Meadow Demands Peace\" is a common phrase, and fighting within the bounds of the Vale is punishable by banishment into the deepest wood — off path and without a map.",
      "details": {
        "Unique Flora": "Sunfire Lily, a flower that only blooms once a year for eight days. It is harvested to make a powerful hallucinatory tea.",
        "Memory": "The Open Vale remembers everyone who has ever entered."
      },
      "you_might_find": [],
      "sub_features": [
        {
          "name": "The Miremist",
          "description": "The Open Vale seems to contain its own weather system, resulting in a perpetual fog. This mist permeates the nearby portions of the Sablewood and adds to the confusion of anyone in the area who loses their way. The fog is so thick and wet that numerous creatures that live in the Lucent River will come ashore to hunt when they otherwise would not. \"When the moon is low, they dance in the miremist and are neither seen nor heard, fully in the mortal realm, nor passed into the realms beyond...\" — From the Song of the Vale"
        },
        {
          "name": "The Stones of the Vale",
          "description": "Standing stones dedicated to the Forgotten Gods mark the edges of the Open Vale. They are carved with a variety of symbols that come from a wide range of languages. The secrets of their magic are lost to the Mortal Realm, but they are rumored to glow with soft blue light when the eyes of the ancient gods turn upon this Sablewood meadow. Travelers that find the clearing are warned to leave an offering at the base of one of the Stones of the Vale, lest the Forgotten Gods send their animals to find the mortal that did not heed their power."
        },
        {
          "name": "The Claravale Market",
          "description": "Unlike the spiritual practices that take place within the Open Vale, there is one celebration with a focus on the material world. Once a year there is a market established within the meadow and all who know how to find their way are invited to come, trade, and celebrate. It takes place over three nights, during which time no gold or coin of any kind is permitted to change hands. Traders are expected to give one another a fair deal, and those who do not follow the tenets of the Claravale Market are removed from the premises. The merchant was thrown into the trees, the sound of coins clattering in her pockets. She attempted to return the next year, but her map was wrong, and she could never find the clearing again."
        }
      ]
    }
  ]'::jsonb,

  -- settlements
  '[
    {
      "name": "Hush",
      "description": "The small village of Hush sits nestled into the heart of the Sablewood. It''s quaint and quiet, renowned for its friendly residents who are accustomed to providing room, board, food, and drink for any travelers and merchants who need a place to stop off during their journey. Wards maintained by the Whitefire Arcanist keep the most dangerous animals from disturbing anyone residing within the four dwarven-stone pillars marking the corners of town. This provides a haven for those who wish to get a good night''s rest and fill their bellies with delicious food.",
      "details": {
        "Village Leaders": "The Faceless Six",
        "Known for": "Welcoming travelers with food and drink"
      },
      "sub_features": [
        {
          "name": "The Sunless Farms",
          "description": "On the southern end of Hush is the community farm that grows fruits, vegetables, grain, and a variety of crops without the need for direct sunlight. These plants have been adapted over centuries to grow in symbiosis with a dark-green moss that covers them. This moss must be cleaned off before the food can be consumed safely. When the Faceless Six arrive to meet with the Whitefire Arcanist, the sunless farms grow a three-month cycle in one day."
        },
        {
          "name": "Guest Privileges",
          "description": "There are no inns or traveler''s camps in town. The culture of Hush dictates that when any outsiders come to visit, they are taken in by a family and given shelter for three nights. During this time, the guest''s needs have priority and they can use anything that belongs to their hosts. After three nights, the visitors must trade families or leave Hush. Those who prey on the kindness and selflessness of the residents of Hush often find out the meaning of the town people''s common phrase \"leave it to the trees.\""
        },
        {
          "name": "Clover''s Tavern",
          "description": "At the center of town is a massive six-story tavern built around the trunk of an ancient tree. Considered by most to be the oldest building in Sablewood, this is the hub of activity and socialization in the city. When newcomers arrive, they must take off their shoes and hang them over the clothing line that runs through the center of the ground floor. It''s not uncommon for the shoes to be polished and for trinkets to be left in them by the residents of Hush. The sixth floor of the tavern requires a counterweight lift to access and is in the highest branches of the treetop, providing a glimpse of sunlight and a stunning view of the forest beyond. Regulars of Clover''s Tavern will sometimes welcome guests to the Inner Rings, a private drinking lounge on the fifth floor, at the center of the ancient tree."
        }
      ]
    },
    {
      "name": "The Refuge",
      "description": "The first stop before entering the Sablewood from the east, or the last (grateful) stop for those who''ve made their way out after a journey from the west, this community considers itself to be the last bastion of \"civilization\" before entering the wilds. The large town is walled on all sides, and the townsfolk are forbidden from entering the Sablewood. In order to \"stop the progression of the all-consuming trees\" firewatchers burn the edges of the Sablewood to keep it from growing beyond its bounds. The most devoted among the firewatchers speak of their efforts like battles, and their lives like a war with the woods. Every so often, these arsonists do not return to the Refuge after a day of burning.",
      "details": {
        "Local Habit": "On-duty guards watching the Sablewood will spit over the wall if they believe something in the forest is watching them in return.",
        "Most Popular Drink": "Fire Wine, a strong golden liquor that is not made from grapes."
      },
      "sub_features": [
        {
          "name": "The Fire Walk",
          "description": "There is a yearly festival to initiate new firewatchers that is welcome to all who wish to witness, but to few who wish to participate. Those invited to join the ranks of the Refuge \"soldiers\" must walk through a massive pyre of sablewood and live to tell the tale. Many die from their excruciating burns, but those who survive are immediately invited to live and work in the enclave. After healing from the Fire Walk, initiates will have their burn scars read by the elder firewatcher to learn details about their fate."
        },
        {
          "name": "Fly Fishing",
          "description": "Off-duty guards and trusted townsfolk will climb to the watchtowers of the Refuge and cast long lines into the canopies of the Sablewood. In this way, they catch a wide variety of animals to eat including town favorites such as rabbits-gliders, moth-possums, and turtle-mice. Fishers must be wary of badger-hawks that will pull their catch from the line, or pull the fisher off the tower."
        },
        {
          "name": "The Ash Quarry",
          "description": "Because of the number of trees burned, the Refuge sits adjacent to a vast field of charred Sablewood. The Refuge claims, cleans, and sells the Sablewood ash as a remedy for any ailment a person might want cured, though there is a general consensus among the residents of the forest that the ash does nothing when sold alone. The firewatchers of the Refuge struggle to protect the Ash Quarry, as the heat and nutrients from the burned trees attract spidermanders that enjoy coating their skin in the black soot. Firewatchers use the presence of these \"monsters\" as a reason to justify burning more of the forest, creating an endless cycle of retaliation. If a citizen of the Refuge comes upon a spidermander dozing in the ash, they are likely to be snatched and consumed, with the beast moving little more than a single limb."
        }
      ]
    },
    {
      "name": "Root''s Hollow",
      "description": "Although reclusive, there is a thriving Underroot community carved into the roots of the northern sablewood trees. Root''s Hollow is one of the few known villages within the inhospitable forest, and though it is hard to get to, it is famed for its size. Few merchants know the locations of the hidden doors within the trees, but those that do make a fortune trafficking specialized potions and medicines from the Root''s Hollow apothecaries. Those who live in the deepest levels of Root''s Hollow must contend with the giant bugs that make their homes deep in the ancient dirt of the Sablewood. Though Root''s Hollow is practiced at deterring the centi-beetles and spidermanders, occasionally these mammoth crawlers destroy entire portions of the underground village. Once they carve their way through the earth, people will use the giant tunnels to form new thoroughfares and living spaces.",
      "details": {
        "Legendary Beast": "Hellbender, an ancient spidermander known for its impeccable ability to sense anything moving underground.",
        "Combat Style": "Citizens of Root''s Hollow are known to fight with sharpened shovels."
      },
      "sub_features": [
        {
          "name": "The Latch",
          "description": "There is an elevator within Root''s Hollow that leads deeper underground than any level the village currently reaches. Only members of the Village Council and their guests are allowed to enter this lift, and it is only utilized once a season. No one outside the council knows what lies at the bottom of the Latch. There is a rumor that the Village Council sacrifices outsiders to a behemoth spidermander that guards the community. Stories describe the ancient beast''s nest in a secret pit beneath Root''s Hollow. Parents tell these tales to children to keep them from wandering off."
        },
        {
          "name": "The Sable Stills",
          "description": "The apothecaries of Root''s Hollow are known across the Realms for their powerful potions and healing concoctions. They would never reveal any details of their process, but a key ingredient is the sable sap that is harvested and fermented in the large stills that lay beneath the earth. When improperly fermented, sable sap is highly toxic. Imitators of this process are often revealed when they cause a client''s death."
        },
        {
          "name": "Knock Wood",
          "description": "When people venture into the far reaches of Root''s Hollow, or even into uncharted territory, they communicate via the tree roots that lace through the soil of the Sablewood. By knocking on roots in specific patterns, they''re able to relay complex messages to one another, in particular, signaling that they are safe and well. Outsiders have attempted to utilize this form of communication to no avail. Members of Root''s Hollow have come to believe that the sablewood trees are helping their messages travel vast distances."
        }
      ]
    }
  ]'::jsonb,

  -- factions
  '[
    {
      "name": "Thistlefolk",
      "description": "The Thistlefolk take up residence in the place where nobody else dares — within the thickest, thorniest bramble of the Sablewood. They are known for wearing armored clothing made up of thousands of tiny polished stones that have been cut to fit together seamlessly, like scales. This attire allows them to move through the barbed thickets without being caught up in its tangle. Because the only Thistlefolk who emerge from the seclusion of their hidden villages are often thieves coming out to steal goods from unwitting travelers or sleeping merchants, they have received a reputation for being a syndicate of criminals. In actuality, most of the Thistlefolk are quite peaceful and vulnerable, choosing to live within the safety of the bramble for their own protection from the large predator species who stalk the woods looking for an easy meal.",
      "details": {
        "Most Commonly Sighted": "In the underbrush and bramble, off-trail.",
        "Misconception": "They are a rogue band of anarchists and criminals."
      },
      "sub_features": [
        {
          "name": "Eclectic Villages",
          "description": "Though functionally invisible to outsiders, the villages within the bramble are vibrant, sprawling, and eclectic. The mudstone walls holding back the dangerous thorns are typically painted with abstract strokes of green to camouflage the villages from any passerby who might notice them. Within, the buildings and walkways are typically painted in bright hues and large murals and lit by bioluminescent moss. When not armored for traveling out into the open forest, most of the Thistlefolk dress in a similar artistic fashion, with self-dyed and sewn garments. An abandoned Thistlefolk village near Hush was discovered after a large fire cleared some of the thicket that it was hidden within. It has since been co-opted as a local hangout for the young people of Hush when they want to get away from their elders."
        },
        {
          "name": "The Wandering Briar",
          "description": "A living thicket of briars estimated to be more than fifty feet tall, one hundred feet thick, and about a mile long, it crawls its way through the endless forests of Sablewood, frequently blocking routes and forcing travelers to take a different pathway to their destination. This moving tangle also serves as a home for a group of traveling Thistlefolk who live within its ever-shifting walls, known as the Wanderers. The Wanderers have learned that when the Wandering Briar draws blood with its thorns, it can absorb the blood to move at a more rapid pace. Clever poisoners may grind the thorns of the Wandering Briar and feed the powder to a target. It inhibits the clotting of blood, turning minor wounds into major injuries."
        },
        {
          "name": "Tumblers",
          "description": "When approaching the tangles of thorny vines that grow along the shoreline of the Lucent River, it is not uncommon to hear an ominous rattling coming from within. Though this scares many inexperienced travelers who might think it''s a creature of some sort warning them to stay away, in fact, the sound derives from the stone tumblers built by the Thistlefolk. They utilize the water''s powerful current to tumble stones in the sediment of the river''s edge until they are as smooth as glass. Thistlefolk must brave the less dense underbrush to retrieve the stones, which can be cut and placed into their specialized armor. The lapidary of each village is responsible for choosing and then cutting the stones that go into the tumblers. They are said to have hands so densely calloused that they could catch the edge of a sword in their palm without bleeding."
        }
      ],
      "principles": [
        "The thorns only catch those who let them.",
        "Look over your shoulder. You don''t know who you are leading home.",
        "Combat the darkness of the world outside with the brightness of life within the bramble."
      ],
      "npcs": [
        {
          "name": "Proven Navir",
          "title": "of the Sixspire Tangle, Stone Retriever",
          "ancestry": "Wildborne Fungril",
          "pronouns": "they/them",
          "traits": ["Quiet", "Focused", "Dedicated"],
          "experience": "Navigation +2, Engineering +1",
          "description": "A small, rotund fungril with bulging eyes covered by goggles to keep them safe from the thorns. They carry a bag twice their size when retrieving stones from the river.",
          "difficulty": 12,
          "motive": "Open a trade route with the Ninespire Tangle across the river."
        },
        {
          "name": "Xen",
          "title": "Lapidarian of the Highbrush",
          "ancestry": "Wildborne Dwarf",
          "pronouns": "she/her",
          "traits": ["Cocky", "Practical", "Discerning"],
          "experience": "Rocks +10",
          "description": "As wide as she is tall with a shaved head and faceted nails, Xen has an assortment of finely polished and cut emerald stones embedded into her right arm.",
          "difficulty": 8,
          "motive": "Get her hands on a mountain crab''s shell to polish and use as armor."
        },
        {
          "name": "Yikyik Trahll",
          "title": "Driftwood",
          "ancestry": "Wildborne Katari",
          "pronouns": "he/him",
          "traits": ["Curious", "Charismatic", "Daring"],
          "experience": "Out of Sight +3, Dodge +2",
          "description": "He is covered in black fur, with a tail that''s shorter after a childhood fight. Yikyik is quick to laugh and has a mischievous glint in his eyes.",
          "difficulty": 14,
          "motive": "Visit every Thistlefolk village in the Sablewood."
        }
      ],
      "story_hooks": [
        "A Thistlefolk stole something of importance from a merchant and they need help to get it back.",
        "The Wandering Briar cut through a small village, decimating homes and causing them to relocate.",
        "Three kids have gone missing after sneaking off to the abandoned Thistlefolk village outside of Hush."
      ]
    },
    {
      "name": "The Sable Sinecure",
      "description": "The Sable Sinecure got their name from years of joking by the fireside, \"To make such a dangerous job, that so few can accomplish, look easy? Well that''s just a walk in the woods!\" This merchant''s guild effectively runs the Sablewood. They closely guard their territory and will protect any traveler that walks the forest paths. In this way, they have an incredible number of members in proportion to the size and danger of the region they transport goods through. The Sable Sinecure is home to the only merchants willing to transport their goods up the Titan''s Steps — as the guild will guarantee any property left or lowered to the forest floor. This allows guild members to make the dangerous journeys with less cargo, and reclaim their wares after the trek.",
      "details": {
        "Highest Earning Settlement": "The Refuge",
        "Motivation": "Gold"
      },
      "sub_features": [
        {
          "name": "Fire-Falcons",
          "description": "Cousin to the phoenix, but by no means immortal, fire-falcons are the preferred companions of the most powerful merchants in the Sable Sinecure. They have the birds fly the path ahead, both leading the way with their natural light and signaling approaching danger. Though small, they are violent adversaries. Fire-falcons will hatch only one clutch of eggs in their lifetime, and the locations of their nests are a closely guarded secret."
        },
        {
          "name": "Secret Caches",
          "description": "To keep their packs and carts as light as possible, the Sable Sinecure utilizes a number of secret caches throughout the forest. These locations are not guarded by members of the guild but by a number of other hidden traps. Those who attempt to steal their wares will have their eyes removed and fed to the fire-falcons. \"Thieves come shopping with nothing to pay, so they pay with the poor sense that led them there.\""
        },
        {
          "name": "Wood Wage",
          "description": "Only within the bounds of the Sablewood, members of the merchant''s guild and surrounding communities will use a phrase known as \"wood wage,\" which is a way of asking the cost of something that quantifies the danger it took to acquire and transport the item. The higher the wood wage, the more costly the barter. \"You earned your wood wage today,\" is a phrase tossed at weary travelers when they come to a campfire worse for the wear."
        }
      ],
      "principles": [
        "All goods to the highest bidder, even death pays our price.",
        "One must make reasonable efforts to protect those around them. This does not extend to anyone who strays from the well-worn paths.",
        "Do not sell that which was not earned. Gifts must be gifted anew."
      ],
      "npcs": [
        {
          "name": "Helena Corain",
          "title": "",
          "ancestry": "Ridgeborne Human",
          "pronouns": "she/her",
          "traits": ["Direct", "Affable", "Brave"],
          "experience": "Climbing +3, Strike a Deal +2",
          "description": "An elderly human that free climbs the Titan''s Steps to collect and sell mountain crab eggs. She''s not from around here but commands more respect than most locals of the wood. She can get free lunch just about anywhere she goes.",
          "difficulty": 12,
          "motive": "Reach the top of the Titan''s Steps."
        },
        {
          "name": "Will Scild",
          "title": "",
          "ancestry": "Wanderborne Galapa",
          "pronouns": "he/him",
          "traits": ["Unphased", "Dry", "Fair"],
          "experience": "Merchant +2, Retaliation +7",
          "description": "A galapa of indeterminate age. Though he moves slowly through the Sablewood with goods of exceedingly high value, no one dares disturb his journey. He carries no weapon, but he is known to toss a small stone back and forth between his hands.",
          "difficulty": 15,
          "motive": "Find the lost treasure rumored to be in Cradle of the Forgotten Gods."
        },
        {
          "name": "Simrith Luhaj",
          "title": "",
          "ancestry": "Loreborne Giant",
          "pronouns": "he/they",
          "traits": ["Coy", "Intelligent", "Flirtatious"],
          "experience": "Out of Sight +3, Dodge +2",
          "description": "The premiere trainer of fire-falcons. He has an old burn scar covering one of his arms, and when asked, claims a \"giant eeligator got me\" with a smirk.",
          "difficulty": 14,
          "motive": "Find and train a Phoenix to join his flock."
        }
      ],
      "story_hooks": [
        "A traveler just ahead is attacked by raiders that come down from the trees. They scream for help.",
        "Members of the Sable Sinecure come to a party, asking for volunteers to join the guard of a particularly precious cargo they''re carting through the Sablewood.",
        "Claiming a nest of recently hatched fire-falcons perched high in the Titans Steps has become the only goal of every member of the Sable Sinecure, and they''ll kill anyone who stands in their way."
      ]
    }
  ]'::jsonb,

  -- moments_of_hope (d12)
  ARRAY[
    'A friendly merchant invites you to their fire and shares a story.',
    'A map of the Briar, only slightly torn.',
    'A fox-bat takes refuge within your coat for the evening.',
    'A young hunter arrives back in town carrying her first kill.',
    'The standing stones of the Forgotten Gods glowing many shades of blue.',
    'A tree branch reaching down to catch you from falling.',
    'A harvest of fresh twilight plums, ripe and pungent.',
    'An ancient wooden chest buried beneath hundreds of years of overgrowth.',
    'A Spire being ascended by its keeper, their nightly hunt over their shoulder.',
    'A lively marketplace full of handcrafted goods and freshly baked pastries.',
    'An ornately decorated carriage pulled by a fleet of horse-goats.',
    'Endless drinks poured over merry music and hearty laughter.'
  ],

  -- moments_of_fear (d12)
  ARRAY[
    'A merchant''s cart overturned, wheel spinning, only viscera left behind.',
    'The snapping of twigs directly behind you.',
    'The wind roaring through the canopy, in its echoes reverberates your name.',
    'A set of animalistic eyes watching from just off the path, waiting for the perfect moment to strike.',
    'Thistlefolk bandits cutting coin purses and disappearing into the underbrush.',
    'A tiger-elk tearing its prey limb from limb.',
    'A wicked smile, then a hand snuffing out your lantern.',
    'Skeletons skewered on tree limbs, old tatters of clothes blowing in the wind.',
    'A pit trap covered in leaves, prepared for its next victim.',
    'A tangle of thorns dripping with fresh blood slowly absorbed.',
    'A shattered sword left behind in pieces, its hilt grown over with moss.',
    'Massive trees uprooted and thrown by something enormous.'
  ],

  -- rumors
  ARRAY[
    'Every spring there is a part of the forest that expands six inches in radius, consuming the wider landscape. In one such expansion, a rare weapon known as the Sableblade grows from the ground.',
    'An ancient faerie lives in a small cottage deep within the woods. It is said she will accept items of value in exchange for providing directions to something the visitor is seeking. Her definition of "value" is unique.',
    'While digging out their tunnels, Underroot communities found massive stone strongholds buried deep within the ground with no clear way to gain access inside.',
    'If you fall asleep in the Sablewood without a campfire, you wake up in a different place than where you fell asleep.',
    'Ember Lake, on the western side of the forest, is a hot spring lake heated by the still-burning forges of a Forgotten God.',
    'If a creature you encounter has an extra eye on the back of its neck, it was captured and released by the Glimpse, a Faint Divinity covered in eyes who cares for injured animals in the Sablewood.'
  ],

  -- loot
  '{
    "equipment": [
      {
        "name": "Sableblade",
        "type": "Primary Weapon - Tier 1",
        "stats": "Agility Melee - d10+1 (phy) - One-Handed",
        "properties": ["Ancient Power: Mark stress before a damage roll to increase your damage total by +3."]
      },
      {
        "name": "Eeligator Scale Shield",
        "type": "Secondary Weapon - Tier 1",
        "stats": "Finesse Melee - d4 (phy) - One-Handed",
        "properties": ["Sharp: Add +1 to your damage thresholds, add +2 to your damage rolls."]
      },
      {
        "name": "Thistlefolk Armor",
        "type": "Armor - Tier 1",
        "stats": "Base Score: 3 - Base Thresholds: 6/13",
        "properties": ["Seamless: When you take minor damage, roll a d12. If it rolls your level or lower, you can mark a Stress instead."]
      }
    ],
    "items": [
      {
        "name": "Returning Stone",
        "description": "This small stone can be placed anywhere, and will teleport to your hand under one of the following conditions: somebody comes within close range, somebody within very close range is dealt damage, a certain amount of time passes, when you speak a keyword."
      },
      {
        "name": "Ward of the Whitefire Arcanist",
        "description": "A carved figurine in the shape of a ratcoon. While carrying this in the Sablewood, it gives you +1 to your Evasion."
      },
      {
        "name": "Sableleaf Shoes",
        "description": "A set of shoes sewn out of the leaves of sablewood trees. They are light and flexible. Wearing them lets you spend Hope to take advantage on agility rolls while in the Sablewood."
      }
    ],
    "consumables": [
      {
        "name": "Bugbane Berry",
        "description": "A delicacy among the residents here, this is a large, red-orange berry with a small insect floating in its center like a pit. When consumed, it provides resistance to magic damage until your next short rest."
      },
      {
        "name": "Sable Sap",
        "description": "The sweet sap from the sablewood trees can be drizzled over food or eaten by the spoonful. Once per long rest, when you have a calm moment to consume this, you may clear 2 Stress."
      },
      {
        "name": "Vial of Briarpowder",
        "description": "Made from shaving thorns of the Wandering Briar, when used on an enemy, it inhibits the clotting of blood. After coating a blade with this powder, the next successful attack you deal one additional hit point."
      }
    ]
  }'::jsonb,

  -- adversaries
  '[
    {
      "name": "Bullfrog",
      "tier": 1,
      "role": "Bruiser",
      "description": "An amphibious bull-sized hybrid with springing legs.",
      "motives_tactics": ["Leap Out of Danger", "Spear with Horns", "Lash with Tongue"],
      "experience": "Territorial +5",
      "attack": "Horns: Melee - 1d8+6 (phy)",
      "thresholds": "8/13",
      "atk": 1,
      "hp": 4,
      "stress": 2,
      "difficulty": 11,
      "features": [
        {
          "name": "Tongue Strike",
          "type": "Action",
          "description": "Make an attack against a target within Close range. On a success, deal 1d8+4 phy damage and pull the target into melee."
        },
        {
          "name": "Powerful Gore",
          "type": "Action",
          "description": "Mark a Stress to leap forward, making an attack with the bullfrog''s horns against all enemies in a straight line within close range. Any that are hit take 2d4+8 phy damage and mark one armor slot that does not reduce any damage. The PC may still mark armor to reduce damage."
        },
        {
          "name": "Leaping Dodge",
          "type": "Reaction",
          "description": "Whenever an attack against this creature misses, the bullfrog may leap anywhere within Far range."
        }
      ]
    },
    {
      "name": "Strixwolf",
      "tier": 1,
      "role": "Skulk",
      "description": "A wolf-owl pack hunter with wings and a rotating head.",
      "motives_tactics": ["Stalk", "Surround", "Protect Pack"],
      "experience": "Tracker +4",
      "attack": "Bite and Claw: Melee - 1d6+3 (phy)",
      "thresholds": "5/10",
      "atk": 2,
      "hp": 4,
      "stress": 2,
      "difficulty": 13,
      "features": [
        {
          "name": "Pack Tactics",
          "type": "Passive",
          "description": "When making a Bite & Claw attack, if another Strixwolf is also in melee range of the target, deal 2d8+2 phy damage instead."
        },
        {
          "name": "Powerful Senses",
          "type": "Passive",
          "description": "This creature ignores the Hidden condition on anyone within close range."
        },
        {
          "name": "Fly",
          "type": "Action",
          "description": "Mark a Stress to make the Strixwolf take flight, increasing their Difficulty by +2 and making their attacks worth +2 damage until the Strixwolf lands."
        }
      ]
    },
    {
      "name": "Eeligator",
      "tier": 1,
      "role": "Solo",
      "description": "A large reptile-fish hybrid with a powerful jaw.",
      "motives_tactics": ["Hide", "Hunt", "Subsume"],
      "experience": "Tracker +4",
      "attack": "Bite: Very Close - 1d12+4 (phy)",
      "thresholds": "12/25",
      "atk": 3,
      "hp": 7,
      "stress": 5,
      "difficulty": 14,
      "features": [
        {
          "name": "Healing Skin",
          "type": "Action",
          "description": "Mark a Stress to heal 1 HP."
        },
        {
          "name": "Pull Under",
          "type": "Action",
          "description": "If a target is within close range of a body of water, you can spend a Fear to make an attack against them. On a success, deal 1d20 phy damage, then move both the Eeligator and the target into the water that''s within close range. The Eeligator pulls the target under, making them Restrained and Drowning. While Drowning, that target must mark a Stress for every action roll that is made."
        },
        {
          "name": "Death Grip",
          "type": "Action",
          "description": "On a successful Bite attack, mark a Stress to lock this creature''s jaw onto the target, dealing 1 additional hit point and making them Restrained until the Eeligator is dealt Major damage. When released, the target must mark a Stress."
        }
      ]
    }
  ]'::jsonb,

  -- environments
  '[
    {
      "name": "Bandit Hideout",
      "tier": 1,
      "type": "Exploration",
      "description": "A shabby but well-defended hideout nestled among the brambles of the Sablewood.",
      "impulses": ["Keep Out Intruders", "Take Watch", "Maintain Readiness to Fight"],
      "potential_adversaries": ["Jagged Knife Bandits (Bandit, Shadow, Hexer, Sniper, Lieutenant, Lackey, Kneebreaker)"],
      "difficulty": 12,
      "features": [
        {
          "name": "Thorn Fence",
          "type": "Passive",
          "description": "Make an attack against a target within Close range. On a success, deal 1d8+4 phy damage and pull the target into melee.",
          "gm_questions": ["How would the bandits notice the brambles have been disturbed? How did the wall get there — do they have a druid or ranger among their number?"]
        },
        {
          "name": "Patrols",
          "type": "Passive",
          "description": "The bandits post a constant watch, mostly directed outside the camp. Entrance will require stealth (Finesse), deception (Presence), or special information (Knowledge).",
          "gm_questions": ["When do they change the watch? What weapons do they have prepared in case of attack?"]
        },
        {
          "name": "Fight Your Way Through",
          "type": "Passive",
          "description": "If the party decides to fight their way through but you want to abstract the battle to save time, call for a Group Action, asking each member of the party how they contribute to the fight, with one PC making the main roll for the group. On a success with Fear, each PC must mark Stress and 1 HP or 1 armor slot. On a failure, each PC must mark 2 Stress and some combination of 2 HP and/or armor slots.",
          "gm_questions": ["What defenses do the bandits have to bring to bear? Does anyone notice the combat or is it over before other bandits take notice?"]
        },
        {
          "name": "On The Hunt",
          "type": "Action",
          "description": "Spend a Fear to have a pack of 1d4+2 hungry Strixwolves infiltrate the hideout, desperate for food.",
          "gm_questions": ["Do the PCs avoid the animals? Do they try to use them as a distraction or backup? Do the PCs have food on them that would draw the animals'' attention?"]
        },
        {
          "name": "Alarm",
          "type": "Reaction",
          "description": "On a failure or success with fear, some of the bandits grow suspicious and more actively patrol. Attempts to pass through the hideout using stealth have disadvantage for the rest of the scene or until the actively patrolling bandits are defeated or distracted by something else.",
          "gm_questions": ["How is it clear the bandits are on higher alert? What additional defense tactics are they preparing?"]
        }
      ]
    },
    {
      "name": "Underroot Tunnels",
      "tier": 1,
      "type": "Traversal",
      "description": "Fortified and well-kept tunnels leading to underborne communities within the great forest.",
      "impulses": ["Confound Travelers", "Bar Passage", "Connect Communities"],
      "potential_adversaries": ["Acid Burrower", "Stonewraith", "Jagged Knife Bandits"],
      "difficulty": 11,
      "features": [
        {
          "name": "Hidden Entrance",
          "type": "Passive",
          "description": "The first challenge of the Underroot Tunnels is finding them. PCs must complete a Progress Countdown (3) to find a viable entrance to the tunnels (Instinct and Knowledge are most applicable, though Finesse could be used to search manually for a seam or switch and Presence could be used to gain information from a denizen of the Sablewood).",
          "gm_questions": ["How do they camouflage the tunnels so well? What traps might they leave in the way?"]
        },
        {
          "name": "A Series of Passageways, All Alike",
          "type": "Passive",
          "description": "Navigating to a particular location in the tunnels requires a Progress Countdown (4 for most known settlements, 6 for less well-known or more-remote destinations). Potential Challenges include identical passageways, damaged stairwells leading to a lower level, root blockage, flooded tunnel.",
          "gm_questions": ["How was this place built to purposefully confuse outsiders? How are patrols run within the tunnels?"]
        },
        {
          "name": "Root Blockage",
          "type": "Action",
          "description": "Reveal that the path ahead has been blocked by the shifting of a great Sablewood tree. The party can dig around the root (Finesse), try to cut through it (Strength), or double back to find another path (Instinct).",
          "gm_questions": ["What other obstacles did the Underroot community build their passages around? What unique approach have they taken to dealing with them?"]
        },
        {
          "name": "Toll-Keepers",
          "type": "Action",
          "description": "Spend a Fear to introduce a number of Jagged Knife Lackeys equal to the size of the party plus two Jagged Knife Bandits and a Jagged Knife Lieutenant seeking a ''toll'' of two handfuls of gold per character for passing through their ''protected territory.''",
          "gm_questions": ["How do the Underroot folk feel about these toll-keepers? What else might they be guarding?"]
        }
      ]
    },
    {
      "name": "The Village of Hush",
      "tier": 1,
      "type": "Social",
      "description": "A small but friendly village nestled into the heart of the Sablewood.",
      "impulses": ["Display Hospitality", "Provide Respite from Danger"],
      "potential_adversaries": ["Merchant", "Bladed Guards", "Strixwolves"],
      "difficulty": 10,
      "features": [
        {
          "name": "Guest Privileges",
          "type": "Passive",
          "description": "Any overnight visitor is taken in by a family and given shelter for three nights. During this time, the guest''s needs have priority and they can use anything that belongs to their hosts. After three nights, the visitors must trade families or leave the town.",
          "gm_questions": ["Which family takes in the PCs? What visitor has been abusing guest privileges and what do they want here?"]
        },
        {
          "name": "Clover''s Tavern",
          "type": "Passive",
          "description": "At the center of the town is a massive six-story tavern built around the trunk of an ancient tree. The tavern is where most of the village gathers in the evening. Here, PCs can learn rumors, meet the villagers, and relax. When they leave, the shoes they put up on the clothing line have minor trinkets inside that reflect how the villagers see them or that provide some minor portent of challenges to come.",
          "gm_questions": ["What''s the talk of the tavern? What clues do the trinkets left in the PC''s shoes/boots provide?"]
        },
        {
          "name": "Preparations",
          "type": "Action",
          "description": "A prominent member of the community approaches the PCs asking for help with unique preparations for the arrival of the town''s leaders, the Faceless Six.",
          "gm_questions": ["Why are the Faceless Six coming to town? What preparations must be done that the party is particularly equipped to help with?"]
        },
        {
          "name": "Leave it to the Trees",
          "type": "Reaction",
          "description": "Spend a Fear when someone abuses guest privileges to summon twelve Young Dryads. They kidnap the culprit and drag them off to face the justice of the Sablewoods.",
          "gm_questions": ["Do the villagers notice when this happens? How do they alert the guardians to these abuses, or do the dryads just know? What is the origin of the guest privilege custom?"]
        }
      ]
    }
  ]'::jsonb,

  -- source_book
  'Sablewood (Darrington Press 2025)'
);
