// Independent implementation; see docs/good-grief-reference.md.
export const GOOD_GRIEF_REVISIONS={
  "gBad1": {
    "act": "卷七 · 故人长逝",
    "when": {
      "route": "good",
      "flag": "forsake",
      "notAll": [
        "cultPath"
      ]
    },
    "type": "talk",
    "before": [],
    "after": [],
    "xp": 65,
    "money": 15,
    "encounterTier": 14,
    "requireStaging": true,
    "repairCompanions": true,
    "suppressBattleSupplies": true,
    "title": "迟到的解药",
    "map": "m49",
    "npc": "纳兰真",
    "sprite": 1,
    "objective": "回庄见真儿，亲口告诉她蔷薇的噩耗",
    "requiredAnyFlags": [
      [
        "goodRoseBuried",
        "goodTowerValleyLegacy",
        "goodGriefLegacyNews"
      ],
      [
        "goodGriefRoadCleared",
        "goodGriefLegacyNews"
      ]
    ],
    "rewards": {
      "flags": {
        "goodGriefNewsTold": true
      },
      "companions": []
    },
    "sources": [
      "docs/good-grief-reference.md"
    ],
    "source": "2101告知真儿噩耗，她离去，进2102；不授予解药物品。仅机制参考；对白、布局、数值及保存独立实现。",
    "referencePolicy": "reference-only-no-original-content",
    "dialogueStatus": "independently-authored-from-verified-mechanics",
    "revised": true
  },
  "gBad2": {
    "act": "卷七 · 故人长逝",
    "when": {
      "route": "good",
      "flag": "forsake",
      "notAll": [
        "cultPath"
      ]
    },
    "type": "boss",
    "before": [],
    "after": [
      [
        "江湖纪事",
        "纳兰潜凛倒下，厅中的剑声骤然止息。",
        0
      ]
    ],
    "xp": 65,
    "money": 15,
    "encounterTier": 14,
    "requireStaging": true,
    "repairCompanions": true,
    "suppressBattleSupplies": false,
    "title": "摘星楼余恨",
    "map": "m71",
    "npc": "纳兰潜凛",
    "sprite": 3,
    "boss": "纳兰潜凛",
    "enemy": "无忧教弟子",
    "count": 45,
    "victoryTarget": "boss",
    "distributedCombat": true,
    "legacyCombatCount": {
      "flag": "goodGriefLegacySingleDuel",
      "count": 1
    },
    "legacyStagingFlag": "goodGriefLegacyRevenge",
    "ending": false,
    "objective": "进入摘星楼，与纳兰潜凛了断；击败纳兰便结束此战",
    "requiredAnyFlags": [
      [
        "goodGriefBuried",
        "goodGriefLegacyRevenge"
      ]
    ],
    "rewards": {
      "flags": {
        "goodGriefDuelWon": true
      },
      "companions": []
    },
    "sources": [
      "docs/good-grief-reference.md"
    ],
    "source": "2104有44敌与纳兰；以纳兰死亡回调立即关AI收束，不要求全清。仅机制参考；对白、布局、数值及保存独立实现。",
    "referencePolicy": "reference-only-no-original-content",
    "dialogueStatus": "independently-authored-from-verified-mechanics",
    "revised": true,
    "afterMarker": {
      "name": "剑止之后",
      "sprite": null,
      "paintOnly": true
    },
    "afterObjective": "纳兰潜凛已倒下。走近地面提示，停剑面对战后的来人。"
  }
};
export const GOOD_GRIEF_ADDITIONS=[
  {
    "beforeId": "gBad1",
    "quests": [
      {
        "act": "卷七 · 故人长逝",
        "when": {
          "route": "good",
          "flag": "forsake",
          "notAll": [
            "cultPath"
          ]
        },
        "type": "battle",
        "before": [],
        "after": [],
        "xp": 0,
        "money": 0,
        "encounterTier": 14,
        "requireStaging": true,
        "repairCompanions": true,
        "suppressBattleSupplies": true,
        "id": "gBad_road",
        "title": "天山封路",
        "map": "r_good_grief_pass",
        "objective": "清除堵住归路的无忧教众，打开通往山庄的道路",
        "npc": "无忧教领头",
        "sprite": 3,
        "count": 34,
        "enemy": "无忧教男弟子",
        "distributedCombat": true,
        "requiredAnyFlags": [
          [
            "goodRoseBuried",
            "goodTowerValleyLegacy"
          ]
        ],
        "rewards": {
          "flags": {
            "goodGriefRoadCleared": true
          },
          "companions": []
        },
        "sources": [
          "docs/good-grief-reference.md"
        ],
        "source": "2100天山33弟子与1领头，34人全清才开路并进2101。仅机制参考；对白、布局、数值及保存独立实现。",
        "referencePolicy": "reference-only-no-original-content",
        "dialogueStatus": "independently-authored-from-verified-mechanics",
        "revised": true,
        "enemyNames": [
          "无忧教男弟子",
          "无忧教男弟子",
          "无忧教男弟子",
          "无忧教男弟子",
          "无忧教男弟子",
          "无忧教男弟子",
          "无忧教男弟子",
          "无忧教男弟子",
          "无忧教男弟子",
          "无忧教男弟子",
          "无忧教男弟子",
          "无忧教男弟子",
          "无忧教男弟子",
          "无忧教男弟子",
          "无忧教男弟子",
          "无忧教男弟子",
          "无忧教男弟子",
          "无忧教男弟子",
          "无忧教男弟子",
          "无忧教男弟子",
          "无忧教男弟子",
          "无忧教男弟子",
          "无忧教男弟子",
          "无忧教男弟子",
          "无忧教男弟子",
          "无忧教男弟子",
          "无忧教男弟子",
          "无忧教男弟子",
          "无忧教男弟子",
          "无忧教男弟子",
          "无忧教男弟子",
          "无忧教男弟子",
          "无忧教男弟子",
          "无忧教领头"
        ],
        "afterMarker": {
          "name": "前路已开",
          "sprite": null,
          "paintOnly": true
        },
        "afterObjective": "堵路的教众已被击退。走近前路提示，继续回庄报信。"
      }
    ]
  },
  {
    "beforeId": "gBad2",
    "quests": [
      {
        "act": "卷七 · 故人长逝",
        "when": {
          "route": "good",
          "flag": "forsake",
          "notAll": [
            "cultPath"
          ]
        },
        "type": "talk",
        "before": [],
        "after": [],
        "xp": 0,
        "money": 0,
        "encounterTier": 14,
        "requireStaging": true,
        "repairCompanions": true,
        "suppressBattleSupplies": true,
        "id": "gBad1_hut",
        "title": "小筑无人应",
        "map": "m16",
        "objective": "进入小筑，走近屋里的故人查明情况",
        "npc": "小筑内室",
        "sprite": null,
        "requiredAnyFlags": [
          [
            "goodGriefNewsTold",
            "goodGriefLegacyNews"
          ]
        ],
        "rewards": {
          "flags": {
            "goodGriefHutFound": true
          },
          "companions": []
        },
        "transition": {
          "map": "r_sakura_memorial"
        },
        "sources": [
          "docs/good-grief-reference.md"
        ],
        "source": "2102入谷加入两女和3教徒遗体，屋内区域触发后直接转樱花谷。仅机制参考；对白、布局、数值及保存独立实现。",
        "referencePolicy": "reference-only-no-original-content",
        "dialogueStatus": "independently-authored-from-verified-mechanics",
        "revised": true
      },
      {
        "act": "卷七 · 故人长逝",
        "when": {
          "route": "good",
          "flag": "forsake",
          "notAll": [
            "cultPath"
          ]
        },
        "type": "talk",
        "before": [],
        "after": [],
        "xp": 0,
        "money": 0,
        "encounterTier": 14,
        "requireStaging": true,
        "repairCompanions": true,
        "suppressBattleSupplies": true,
        "id": "gBad1_burial",
        "title": "樱花无言",
        "map": "r_sakura_memorial",
        "objective": "在樱林静地安葬紫轩与眉儿，再循山路赴摘星楼",
        "npc": "安葬故人",
        "sprite": null,
        "requiredFlags": [
          "goodGriefHutFound"
        ],
        "rewards": {
          "flags": {
            "goodGriefBuried": true
          },
          "companions": []
        },
        "sources": [
          "docs/good-grief-reference.md"
        ],
        "source": "樱花谷两墓与2103；安葬拆为独立墓前交互属于网页表现。仅机制参考；对白、布局、数值及保存独立实现。",
        "referencePolicy": "reference-only-no-original-content",
        "dialogueStatus": "independently-authored-from-verified-mechanics",
        "revised": true
      }
    ]
  },
  {
    "beforeId": "e01",
    "quests": [
      {
        "act": "卷七 · 故人长逝",
        "when": {
          "route": "good",
          "flag": "forsake",
          "notAll": [
            "cultPath"
          ]
        },
        "type": "talk",
        "before": [],
        "after": [],
        "xp": 0,
        "money": 0,
        "encounterTier": 14,
        "requireStaging": true,
        "repairCompanions": true,
        "suppressBattleSupplies": true,
        "id": "gBad2_aftermath",
        "title": "剑止之后",
        "map": "m71",
        "objective": "停下剑，与赶来的真儿料理后事",
        "npc": "纳兰真",
        "sprite": 1,
        "requiredAnyFlags": [
          [
            "goodGriefDuelWon",
            "goodGriefLegacyDuel"
          ]
        ],
        "rewards": {
          "flags": {
            "goodGriefFarewellReady": true
          },
          "companions": [
            "纳兰真"
          ]
        },
        "transition": {
          "map": "m34"
        },
        "sources": [
          "docs/good-grief-reference.md"
        ],
        "source": "纳兰死亡后关AI清人物、真儿到场；安葬和归岛原以叙述影片结束，网页展开为独立演出。仅机制参考；对白、布局、数值及保存独立实现。",
        "referencePolicy": "reference-only-no-original-content",
        "dialogueStatus": "independently-authored-from-verified-mechanics",
        "revised": true
      },
      {
        "act": "卷七 · 故人长逝",
        "when": {
          "route": "good",
          "flag": "forsake",
          "notAll": [
            "cultPath"
          ]
        },
        "type": "talk",
        "before": [],
        "after": [],
        "xp": 0,
        "money": 0,
        "encounterTier": 14,
        "requireStaging": true,
        "repairCompanions": true,
        "suppressBattleSupplies": true,
        "id": "gBad2_departure",
        "title": "海风中的归路",
        "map": "m34",
        "objective": "与真儿在岛岸停步，把余生留给平静的日子",
        "npc": "纳兰真",
        "sprite": 1,
        "requiredFlags": [
          "goodGriefFarewellReady"
        ],
        "endingId": "zhen_good",
        "rewards": {
          "companions": []
        },
        "sources": [
          "docs/good-grief-reference.md"
        ],
        "source": "二人归忘忧岛的叙述已核；可见岛岸场景与对白为原创展开，非原LoadMap复原。仅机制参考；对白、布局、数值及保存独立实现。",
        "referencePolicy": "reference-only-no-original-content",
        "dialogueStatus": "independently-authored-from-verified-mechanics",
        "revised": true
      }
    ]
  }
];
