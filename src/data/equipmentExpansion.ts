import type { Chalk, Tip, EquipmentCase, CueMarketplaceItem } from '../types/game';

// Fictional equipment. Append-only IDs preserve owned items and existing save setups.
// Prices and ratings use the game's existing scale; no new performance caps.

export const expandedCues: Omit<CueMarketplaceItem, 'ownershipStatus'>[] = [
  {
    "id": "cue-13",
    "name": "Willow Junior Balance",
    "price": 95,
    "tier": "Budget",
    "condition": 100,
    "familiarity": 0,
    "weight": "17.0 oz",
    "balance": "Centre",
    "touch": 50,
    "spinControl": 43,
    "stability": 52,
    "durability": 64,
    "bonuses": {
      "Cue Ball Control": 2,
      "Touch": 3,
      "Spin Control": 1,
      "Break Building": 1,
      "Consistency": 2,
      "Miscue Reduction": 1
    },
    "style": "Junior Balance",
    "tags": [],
    "description": "A light club cue with steady control; limited scoring assistance."
  },
  {
    "id": "cue-14",
    "name": "Foundry Club Firm",
    "price": 175,
    "tier": "Budget",
    "condition": 100,
    "familiarity": 0,
    "weight": "19.0 oz",
    "balance": "Forward",
    "touch": 48,
    "spinControl": 46,
    "stability": 64,
    "durability": 80,
    "bonuses": {
      "Cue Ball Control": 2,
      "Touch": 1,
      "Spin Control": 2,
      "Break Building": 1,
      "Consistency": 4,
      "Miscue Reduction": 2
    },
    "style": "Firm Delivery",
    "tags": [],
    "description": "Stability and a durable shaft take priority over delicate touch."
  },
  {
    "id": "cue-15",
    "name": "Meadow Soft Touch",
    "price": 340,
    "tier": "Budget",
    "condition": 100,
    "familiarity": 0,
    "weight": "17.8 oz",
    "balance": "Neutral",
    "touch": 69,
    "spinControl": 65,
    "stability": 54,
    "durability": 62,
    "bonuses": {
      "Cue Ball Control": 4,
      "Touch": 6,
      "Spin Control": 5,
      "Break Building": 4,
      "Consistency": 2,
      "Miscue Reduction": 2
    },
    "style": "Soft Touch",
    "tags": [],
    "description": "More touch and spin than its club peers, with less stability."
  },
  {
    "id": "cue-16",
    "name": "Northbank Safety Ash",
    "price": 625,
    "tier": "Mid-Tier",
    "condition": 100,
    "familiarity": 0,
    "weight": "18.5 oz",
    "balance": "Centre",
    "touch": 68,
    "spinControl": 61,
    "stability": 79,
    "durability": 83,
    "bonuses": {
      "Cue Ball Control": 8,
      "Touch": 7,
      "Spin Control": 5,
      "Break Building": 5,
      "Consistency": 11,
      "Miscue Reduction": 8
    },
    "style": "Safety Control",
    "tags": [],
    "description": "Steady delivery and consistency; less help with attacking spin."
  },
  {
    "id": "cue-17",
    "name": "Cinder Scoring Maple",
    "price": 920,
    "tier": "Mid-Tier",
    "condition": 100,
    "familiarity": 0,
    "weight": "18.0 oz",
    "balance": "Forward",
    "touch": 77,
    "spinControl": 82,
    "stability": 68,
    "durability": 72,
    "bonuses": {
      "Cue Ball Control": 10,
      "Touch": 11,
      "Spin Control": 14,
      "Break Building": 13,
      "Consistency": 7,
      "Miscue Reduction": 6
    },
    "style": "Scoring Bias",
    "tags": [],
    "description": "Spin and break-building support at the expense of stability."
  },
  {
    "id": "cue-18",
    "name": "Pennine Road Match",
    "price": 1350,
    "tier": "Mid-Tier",
    "condition": 100,
    "familiarity": 0,
    "weight": "18.6 oz",
    "balance": "Neutral",
    "touch": 72,
    "spinControl": 69,
    "stability": 84,
    "durability": 90,
    "bonuses": {
      "Cue Ball Control": 10,
      "Touch": 8,
      "Spin Control": 8,
      "Break Building": 8,
      "Consistency": 13,
      "Miscue Reduction": 10
    },
    "style": "Tour Reliability",
    "tags": [],
    "description": "A sturdy touring cue with consistent delivery and modest touch."
  },
  {
    "id": "cue-19",
    "name": "Harbour Precision 58",
    "price": 1650,
    "tier": "Mid-Tier",
    "condition": 100,
    "familiarity": 0,
    "weight": "18.2 oz",
    "balance": "Centre",
    "touch": 78,
    "spinControl": 75,
    "stability": 87,
    "durability": 79,
    "bonuses": {
      "Cue Ball Control": 13,
      "Touch": 10,
      "Spin Control": 9,
      "Break Building": 9,
      "Consistency": 14,
      "Miscue Reduction": 11
    },
    "style": "Precision Control",
    "tags": [],
    "description": "High stability for its price; less spin support than scoring models."
  },
  {
    "id": "cue-20",
    "name": "Orchard Feather Touch",
    "price": 2250,
    "tier": "Mid-Tier",
    "condition": 100,
    "familiarity": 0,
    "weight": "17.3 oz",
    "balance": "Forward",
    "touch": 87,
    "spinControl": 83,
    "stability": 73,
    "durability": 71,
    "bonuses": {
      "Cue Ball Control": 14,
      "Touch": 16,
      "Spin Control": 14,
      "Break Building": 12,
      "Consistency": 9,
      "Miscue Reduction": 8
    },
    "style": "Touch Specialist",
    "tags": [],
    "description": "A light touch specialist with lower shaft durability and stability."
  },
  {
    "id": "cue-21",
    "name": "Rook Tournament Firm",
    "price": 2850,
    "tier": "Elite",
    "condition": 100,
    "familiarity": 0,
    "weight": "18.8 oz",
    "balance": "Centre",
    "touch": 80,
    "spinControl": 76,
    "stability": 94,
    "durability": 92,
    "bonuses": {
      "Cue Ball Control": 15,
      "Touch": 12,
      "Spin Control": 11,
      "Break Building": 12,
      "Consistency": 19,
      "Miscue Reduction": 16
    },
    "style": "Firm Control",
    "tags": [
      "Tournament Grade"
    ],
    "description": "Prioritises reliable delivery over maximum spin assistance."
  },
  {
    "id": "cue-22",
    "name": "Juniper Breakcraft",
    "price": 3900,
    "tier": "Elite",
    "condition": 100,
    "familiarity": 0,
    "weight": "17.7 oz",
    "balance": "Forward",
    "touch": 92,
    "spinControl": 95,
    "stability": 82,
    "durability": 83,
    "bonuses": {
      "Cue Ball Control": 18,
      "Touch": 17,
      "Spin Control": 23,
      "Break Building": 21,
      "Consistency": 12,
      "Miscue Reduction": 11
    },
    "style": "Break Building",
    "tags": [
      "Tournament Grade"
    ],
    "description": "Strong scoring support; less forgiving consistency than firm models."
  },
  {
    "id": "cue-23",
    "name": "Solstice Match Balance",
    "price": 5400,
    "tier": "Elite",
    "condition": 100,
    "familiarity": 0,
    "weight": "18.1 oz",
    "balance": "Neutral",
    "touch": 88,
    "spinControl": 86,
    "stability": 90,
    "durability": 88,
    "bonuses": {
      "Cue Ball Control": 17,
      "Touch": 16,
      "Spin Control": 16,
      "Break Building": 16,
      "Consistency": 18,
      "Miscue Reduction": 15
    },
    "style": "Match Balance",
    "tags": [
      "Tournament Grade"
    ],
    "description": "Balanced tournament support without a single extreme strength."
  },
  {
    "id": "cue-24",
    "name": "Tamarind Control Reserve",
    "price": 6900,
    "tier": "Elite",
    "condition": 100,
    "familiarity": 0,
    "weight": "18.4 oz",
    "balance": "Centre",
    "touch": 91,
    "spinControl": 83,
    "stability": 96,
    "durability": 87,
    "bonuses": {
      "Cue Ball Control": 20,
      "Touch": 18,
      "Spin Control": 13,
      "Break Building": 14,
      "Consistency": 22,
      "Miscue Reduction": 18
    },
    "style": "Precision Control",
    "tags": [
      "Tournament Grade"
    ],
    "description": "Exceptional stability and control; a restrained spin profile."
  },
  {
    "id": "cue-25",
    "name": "Alder Artisan One-Piece",
    "price": 10500,
    "tier": "Legendary",
    "condition": 100,
    "familiarity": 0,
    "weight": "17.6 oz",
    "balance": "Forward",
    "touch": 97,
    "spinControl": 95,
    "stability": 88,
    "durability": 84,
    "bonuses": {
      "Cue Ball Control": 22,
      "Touch": 24,
      "Spin Control": 23,
      "Break Building": 21,
      "Consistency": 15,
      "Miscue Reduction": 14
    },
    "style": "Artisan Touch",
    "tags": [
      "One-Piece"
    ],
    "description": "Premium touch and spin; gives up stability and durability to firmer cues."
  },
  {
    "id": "cue-26",
    "name": "Obsidian Match Sentinel",
    "price": 16500,
    "tier": "Legendary",
    "condition": 100,
    "familiarity": 0,
    "weight": "18.7 oz",
    "balance": "Centre",
    "touch": 88,
    "spinControl": 85,
    "stability": 98,
    "durability": 96,
    "bonuses": {
      "Cue Ball Control": 21,
      "Touch": 17,
      "Spin Control": 16,
      "Break Building": 17,
      "Consistency": 24,
      "Miscue Reduction": 23
    },
    "style": "Match Consistency",
    "tags": [
      "Tournament Grade"
    ],
    "description": "A consistency specialist with less touch than artisan scoring cues."
  },
  {
    "id": "cue-27",
    "name": "Aurora Bespoke Scorer",
    "price": 22000,
    "tier": "Legendary",
    "condition": 100,
    "familiarity": 0,
    "weight": "17.9 oz",
    "balance": "Custom Forward",
    "touch": 96,
    "spinControl": 98,
    "stability": 90,
    "durability": 89,
    "bonuses": {
      "Cue Ball Control": 23,
      "Touch": 22,
      "Spin Control": 24,
      "Break Building": 24,
      "Consistency": 17,
      "Miscue Reduction": 16
    },
    "style": "Custom Scoring",
    "tags": [
      "Tournament Grade"
    ],
    "description": "Top-end attacking support; deliberately below the firm models for consistency."
  }
];

export const expandedChalks: Chalk[] = [
  {
    "id": "chalk-17",
    "name": "Parish Practice Blue",
    "cost": 6,
    "tier": "Budget",
    "grip": 62,
    "cleanContact": 58,
    "spinTransfer": 57,
    "consistency": 65,
    "miscueReduction": 60,
    "kickReduction": 52,
    "description": "Affordable practice chalk with modest grip and spin transfer."
  },
  {
    "id": "chalk-18",
    "name": "Millhouse Firm Grip",
    "cost": 11,
    "tier": "Budget",
    "grip": 77,
    "cleanContact": 59,
    "spinTransfer": 66,
    "consistency": 65,
    "miscueReduction": 74,
    "kickReduction": 52,
    "description": "More grip for club play, with a lower clean-contact rating."
  },
  {
    "id": "chalk-19",
    "name": "Clearline Club White",
    "cost": 15,
    "tier": "Budget",
    "grip": 64,
    "cleanContact": 81,
    "spinTransfer": 61,
    "consistency": 70,
    "miscueReduction": 64,
    "kickReduction": 78,
    "description": "Clean-contact specialist with less grip and spin assistance."
  },
  {
    "id": "chalk-20",
    "name": "Ember Club Spin",
    "cost": 21,
    "tier": "Budget",
    "grip": 76,
    "cleanContact": 67,
    "spinTransfer": 83,
    "consistency": 67,
    "miscueReduction": 70,
    "kickReduction": 60,
    "description": "Extra spin transfer at club prices; less consistent contact."
  },
  {
    "id": "chalk-21",
    "name": "Slate Match Steady",
    "cost": 29,
    "tier": "Mid-Tier",
    "grip": 75,
    "cleanContact": 77,
    "spinTransfer": 70,
    "consistency": 87,
    "miscueReduction": 78,
    "kickReduction": 74,
    "description": "Consistency-focused match chalk with restrained spin transfer."
  },
  {
    "id": "chalk-22",
    "name": "Fern Contact Select",
    "cost": 35,
    "tier": "Mid-Tier",
    "grip": 73,
    "cleanContact": 88,
    "spinTransfer": 71,
    "consistency": 82,
    "miscueReduction": 74,
    "kickReduction": 88,
    "description": "Strong clean contact; gives up grip to specialist formulas."
  },
  {
    "id": "chalk-23",
    "name": "Copper Grip Plus",
    "cost": 43,
    "tier": "Mid-Tier",
    "grip": 90,
    "cleanContact": 72,
    "spinTransfer": 82,
    "consistency": 79,
    "miscueReduction": 89,
    "kickReduction": 66,
    "description": "Grip and miscue support first, with a lower clean-contact rating."
  },
  {
    "id": "chalk-24",
    "name": "Violet Scoring Blend",
    "cost": 49,
    "tier": "Mid-Tier",
    "grip": 84,
    "cleanContact": 75,
    "spinTransfer": 93,
    "consistency": 80,
    "miscueReduction": 80,
    "kickReduction": 70,
    "description": "High spin transfer for scoring setups; middling clean contact."
  },
  {
    "id": "chalk-25",
    "name": "Glacier Tour Clean",
    "cost": 62,
    "tier": "Elite",
    "grip": 80,
    "cleanContact": 95,
    "spinTransfer": 77,
    "consistency": 89,
    "miscueReduction": 82,
    "kickReduction": 94,
    "description": "Clean-contact specialist, with less spin than attacking blends."
  },
  {
    "id": "chalk-26",
    "name": "Anchor Tour Grip",
    "cost": 74,
    "tier": "Elite",
    "grip": 96,
    "cleanContact": 80,
    "spinTransfer": 87,
    "consistency": 87,
    "miscueReduction": 96,
    "kickReduction": 76,
    "description": "Maximum grip emphasis; less clean contact than Glacier."
  },
  {
    "id": "chalk-27",
    "name": "Briar Tour Balance",
    "cost": 82,
    "tier": "Elite",
    "grip": 88,
    "cleanContact": 89,
    "spinTransfer": 87,
    "consistency": 93,
    "miscueReduction": 89,
    "kickReduction": 86,
    "description": "Consistent tournament blend without an extreme specialist rating."
  },
  {
    "id": "chalk-28",
    "name": "Saffron Spin Reserve",
    "cost": 95,
    "tier": "Elite",
    "grip": 91,
    "cleanContact": 83,
    "spinTransfer": 98,
    "consistency": 90,
    "miscueReduction": 89,
    "kickReduction": 78,
    "description": "Exceptional spin transfer; lower clean contact than premium clean blends."
  },
  {
    "id": "chalk-29",
    "name": "Pearl Clean Reserve",
    "cost": 118,
    "tier": "Legendary",
    "grip": 87,
    "cleanContact": 98,
    "spinTransfer": 83,
    "consistency": 95,
    "miscueReduction": 88,
    "kickReduction": 98,
    "description": "Premium clean contact with deliberately limited spin transfer."
  },
  {
    "id": "chalk-30",
    "name": "Onyx Grip Reserve",
    "cost": 132,
    "tier": "Legendary",
    "grip": 98,
    "cleanContact": 87,
    "spinTransfer": 91,
    "consistency": 95,
    "miscueReduction": 98,
    "kickReduction": 83,
    "description": "Premium grip and miscue support; lower clean contact than Pearl."
  },
  {
    "id": "chalk-31",
    "name": "Linden Match Reserve",
    "cost": 150,
    "tier": "Legendary",
    "grip": 93,
    "cleanContact": 94,
    "spinTransfer": 91,
    "consistency": 97,
    "miscueReduction": 94,
    "kickReduction": 92,
    "description": "A consistent premium blend; specialists still lead in grip or spin."
  }
];

export const expandedTips: Tip[] = [
  {
    "id": "tip-17",
    "name": "Village Pressed Firm",
    "cost": 8,
    "tier": "Budget",
    "hardness": "Hard",
    "durability": 80,
    "spinControl": 52,
    "feel": 54,
    "consistency": 64,
    "miscueReduction": 62,
    "description": "Firm and affordable, with limited spin and touch assistance."
  },
  {
    "id": "tip-18",
    "name": "Cotton Club Soft",
    "cost": 14,
    "tier": "Budget",
    "hardness": "Soft",
    "durability": 48,
    "spinControl": 80,
    "feel": 87,
    "consistency": 61,
    "miscueReduction": 64,
    "description": "Soft touch and spin at a low price; less consistent delivery."
  },
  {
    "id": "tip-19",
    "name": "Brook Club Medium",
    "cost": 22,
    "tier": "Budget",
    "hardness": "Medium",
    "durability": 71,
    "spinControl": 71,
    "feel": 74,
    "consistency": 79,
    "miscueReduction": 74,
    "description": "A steady club all-rounder with moderate spin."
  },
  {
    "id": "tip-20",
    "name": "Forge League Hard",
    "cost": 31,
    "tier": "Mid-Tier",
    "hardness": "Hard",
    "durability": 91,
    "spinControl": 62,
    "feel": 63,
    "consistency": 84,
    "miscueReduction": 82,
    "description": "Firm, consistent delivery with less touch than softer tips."
  },
  {
    "id": "tip-21",
    "name": "Hazel Layered Soft",
    "cost": 39,
    "tier": "Mid-Tier",
    "hardness": "Soft",
    "durability": 61,
    "spinControl": 91,
    "feel": 94,
    "consistency": 75,
    "miscueReduction": 79,
    "description": "Strong touch and spin; lower consistency than firm alternatives."
  },
  {
    "id": "tip-22",
    "name": "Flint League Firm",
    "cost": 45,
    "tier": "Mid-Tier",
    "hardness": "Firm",
    "durability": 87,
    "spinControl": 70,
    "feel": 72,
    "consistency": 92,
    "miscueReduction": 87,
    "description": "Consistency and miscue support take priority over spin."
  },
  {
    "id": "tip-23",
    "name": "Clover Layered Medium",
    "cost": 53,
    "tier": "Mid-Tier",
    "hardness": "Medium",
    "durability": 80,
    "spinControl": 84,
    "feel": 84,
    "consistency": 88,
    "miscueReduction": 83,
    "description": "Balanced league support without sacrificing too much feel."
  },
  {
    "id": "tip-24",
    "name": "Sequoia Power Firm",
    "cost": 64,
    "tier": "Mid-Tier",
    "hardness": "Medium-Hard",
    "durability": 90,
    "spinControl": 82,
    "feel": 72,
    "consistency": 87,
    "miscueReduction": 80,
    "description": "Firm scoring setup with less soft-touch assistance."
  },
  {
    "id": "tip-25",
    "name": "Velour Tour Soft",
    "cost": 79,
    "tier": "Elite",
    "hardness": "Soft",
    "durability": 68,
    "spinControl": 96,
    "feel": 98,
    "consistency": 81,
    "miscueReduction": 86,
    "description": "Exceptional soft touch; trades away consistency for spin and feel."
  },
  {
    "id": "tip-26",
    "name": "Basalt Tour Hard",
    "cost": 89,
    "tier": "Elite",
    "hardness": "Hard",
    "durability": 97,
    "spinControl": 67,
    "feel": 68,
    "consistency": 95,
    "miscueReduction": 94,
    "description": "Reliable firm contact and miscue support, with restrained spin."
  },
  {
    "id": "tip-27",
    "name": "Rowan Tour Medium",
    "cost": 98,
    "tier": "Elite",
    "hardness": "Medium",
    "durability": 86,
    "spinControl": 90,
    "feel": 89,
    "consistency": 93,
    "miscueReduction": 91,
    "description": "Steady tournament support; no single rating leads the category."
  },
  {
    "id": "tip-28",
    "name": "Marigold Scoring Select",
    "cost": 112,
    "tier": "Elite",
    "hardness": "Medium-Soft",
    "durability": 77,
    "spinControl": 98,
    "feel": 96,
    "consistency": 89,
    "miscueReduction": 87,
    "description": "Scoring-focused spin and feel with less consistency than firmer tips."
  },
  {
    "id": "tip-29",
    "name": "Granite Match Reserve",
    "cost": 135,
    "tier": "Legendary",
    "hardness": "Medium-Hard",
    "durability": 98,
    "spinControl": 81,
    "feel": 78,
    "consistency": 98,
    "miscueReduction": 97,
    "description": "Premium firm consistency; softer tips provide more spin and touch."
  },
  {
    "id": "tip-30",
    "name": "Silk Artisan Soft",
    "cost": 158,
    "tier": "Legendary",
    "hardness": "Soft",
    "durability": 73,
    "spinControl": 99,
    "feel": 99,
    "consistency": 88,
    "miscueReduction": 90,
    "description": "Premium soft feel and spin; not the most consistent option."
  },
  {
    "id": "tip-31",
    "name": "Meridian Balanced Reserve",
    "cost": 180,
    "tier": "Legendary",
    "hardness": "Medium",
    "durability": 94,
    "spinControl": 93,
    "feel": 92,
    "consistency": 97,
    "miscueReduction": 96,
    "description": "Premium balanced support; specialist soft tips still lead for touch."
  }
];

export const expandedCases: EquipmentCase[] = [
  {
    "id": "case-13",
    "name": "Canal Canvas Sleeve",
    "price": 40,
    "tier": "Budget",
    "protection": 36,
    "storage": 22,
    "travelComfort": 66,
    "presentation": 28,
    "bonuses": {
      "Protection": 2,
      "Storage": 1,
      "Travel": 9,
      "Presentation": 1
    },
    "description": "Light and inexpensive for local trips; limited cue protection."
  },
  {
    "id": "case-14",
    "name": "Workshop Compact Shell",
    "price": 85,
    "tier": "Budget",
    "protection": 63,
    "storage": 31,
    "travelComfort": 43,
    "presentation": 35,
    "bonuses": {
      "Protection": 8,
      "Storage": 1,
      "Travel": 3,
      "Presentation": 1
    },
    "description": "Rigid protection on a budget, with little storage and carrying comfort."
  },
  {
    "id": "case-15",
    "name": "Clubmate Accessory Bag",
    "price": 130,
    "tier": "Budget",
    "protection": 49,
    "storage": 75,
    "travelComfort": 62,
    "presentation": 42,
    "bonuses": {
      "Protection": 5,
      "Storage": 11,
      "Travel": 8,
      "Presentation": 3
    },
    "description": "Room for accessories; less protection than a hard case."
  },
  {
    "id": "case-16",
    "name": "Metro Light Carry",
    "price": 245,
    "tier": "Mid-Tier",
    "protection": 62,
    "storage": 48,
    "travelComfort": 90,
    "presentation": 55,
    "bonuses": {
      "Protection": 8,
      "Storage": 4,
      "Travel": 15,
      "Presentation": 6
    },
    "description": "Easy to carry on frequent trips; modest impact protection."
  },
  {
    "id": "case-17",
    "name": "Quarry Rigid 3/4",
    "price": 320,
    "tier": "Mid-Tier",
    "protection": 87,
    "storage": 52,
    "travelComfort": 56,
    "presentation": 46,
    "bonuses": {
      "Protection": 14,
      "Storage": 6,
      "Travel": 6,
      "Presentation": 4
    },
    "description": "Strong cue protection, with less carrying comfort."
  },
  {
    "id": "case-18",
    "name": "Ranger League Holdall",
    "price": 470,
    "tier": "Mid-Tier",
    "protection": 70,
    "storage": 92,
    "travelComfort": 75,
    "presentation": 57,
    "bonuses": {
      "Protection": 10,
      "Storage": 16,
      "Travel": 11,
      "Presentation": 7
    },
    "description": "Generous accessory storage and average protection."
  },
  {
    "id": "case-19",
    "name": "Walnut Match Presentation",
    "price": 690,
    "tier": "Mid-Tier",
    "protection": 73,
    "storage": 62,
    "travelComfort": 68,
    "presentation": 91,
    "bonuses": {
      "Protection": 11,
      "Storage": 8,
      "Travel": 10,
      "Presentation": 15
    },
    "description": "A presentation-focused finish; touring cases offer better protection."
  },
  {
    "id": "case-20",
    "name": "Skyline Light Tour",
    "price": 950,
    "tier": "Mid-Tier",
    "protection": 77,
    "storage": 68,
    "travelComfort": 95,
    "presentation": 70,
    "bonuses": {
      "Protection": 12,
      "Storage": 10,
      "Travel": 16,
      "Presentation": 10
    },
    "description": "Comfortable touring case with less protection than rigid vaults."
  },
  {
    "id": "case-21",
    "name": "Rampart Flight Shell",
    "price": 1550,
    "tier": "Elite",
    "protection": 96,
    "storage": 73,
    "travelComfort": 70,
    "presentation": 62,
    "bonuses": {
      "Protection": 16,
      "Storage": 11,
      "Travel": 10,
      "Presentation": 8
    },
    "description": "Impact protection first; heavier and less comfortable to carry."
  },
  {
    "id": "case-22",
    "name": "Atlas Team Carrier",
    "price": 2050,
    "tier": "Elite",
    "protection": 86,
    "storage": 98,
    "travelComfort": 80,
    "presentation": 71,
    "bonuses": {
      "Protection": 14,
      "Storage": 17,
      "Travel": 12,
      "Presentation": 10
    },
    "description": "Large storage capacity, with less protection than Rampart."
  },
  {
    "id": "case-23",
    "name": "Willow Executive Light",
    "price": 2950,
    "tier": "Elite",
    "protection": 84,
    "storage": 77,
    "travelComfort": 98,
    "presentation": 88,
    "bonuses": {
      "Protection": 14,
      "Storage": 12,
      "Travel": 17,
      "Presentation": 14
    },
    "description": "Premium carrying comfort; gives up some rigid-shell protection."
  },
  {
    "id": "case-24",
    "name": "Gilded Match Trunk",
    "price": 3800,
    "tier": "Elite",
    "protection": 90,
    "storage": 83,
    "travelComfort": 77,
    "presentation": 99,
    "bonuses": {
      "Protection": 15,
      "Storage": 13,
      "Travel": 12,
      "Presentation": 17
    },
    "description": "Premium presentation with lower carrying comfort than light cases."
  },
  {
    "id": "case-25",
    "name": "Citadel Bespoke Vault",
    "price": 6200,
    "tier": "Legendary",
    "protection": 99,
    "storage": 89,
    "travelComfort": 82,
    "presentation": 85,
    "bonuses": {
      "Protection": 17,
      "Storage": 15,
      "Travel": 13,
      "Presentation": 14
    },
    "description": "Maximum protection emphasis; lighter cases are easier to carry."
  },
  {
    "id": "case-26",
    "name": "Zephyr Bespoke Carry",
    "price": 7900,
    "tier": "Legendary",
    "protection": 90,
    "storage": 85,
    "travelComfort": 99,
    "presentation": 94,
    "bonuses": {
      "Protection": 15,
      "Storage": 14,
      "Travel": 17,
      "Presentation": 16
    },
    "description": "Premium travel comfort with less protection than the rigid vault."
  },
  {
    "id": "case-27",
    "name": "Grandmaster Archive Trunk",
    "price": 10800,
    "tier": "Legendary",
    "protection": 97,
    "storage": 99,
    "travelComfort": 88,
    "presentation": 99,
    "bonuses": {
      "Protection": 17,
      "Storage": 17,
      "Travel": 14,
      "Presentation": 17
    },
    "description": "Storage and presentation lead; less travel comfort than Zephyr."
  }
];
