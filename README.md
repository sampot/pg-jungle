# pg-jungle

華語圈懷舊**鬥獸棋**：獸穴、陷阱、河界、獅虎跳躍、簡易人機。純前端，無建置步驟。

棋種為民間常見玩法之實作小品，非任一商業軟體復刻。

也可當作 [Playgrounds（遊樂場）](https://samkuo.me/playgrounds/) 的 **SAM**（`index.html` 入口）。規則或 AI 想再調？開進來玩，再叫 AI 幫你改一版。

## 一鍵開 SAM 小

**[一鍵開 SAM 小](https://samkuo.me/playgrounds/?open=sampot%2Fpg-jungle&name=%E9%AC%A5%E7%8D%B8%E6%A3%8B)**

```
https://samkuo.me/playgrounds/?open=sampot/pg-jungle&name=鬥獸棋
```

同源會重用本機已匯入的沙盒；要強制新建可加 `&fresh=1`。

## 試玩（本機）

```bash
npx --yes serve .
# 或
python3 -m http.server 8080
```

## 操作

| 操作 | 說明 |
| --- | --- |
| 點己方 → 目標格 | 移動或吃子 |
| 新局 | 重置 |
| 音效開／關 | 靜音 |

## 規則摘要

- 等級：象＞獅＞虎＞豹＞狼＞狗＞貓＞鼠
- 鼠可吃象；象不能吃鼠
- 僅鼠可入水；獅／虎可跳過河界（路徑無鼠）
- 敵獸在你的陷阱中可被任意吃
- 攻入對方獸穴或吃光即勝

## License

MIT
