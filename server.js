const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

app.use(express.static('public')); // 静的ファイルの提供

// ランダムなポケモンと選択肢を返すエンドポイント
app.get('/pokemon/quiz', async (req, res) => {
    try {
        // ランダムなポケモンIDを生成（1〜1010の範囲）
        const randomIds = Array.from({ length: 3 }, () => Math.floor(Math.random() * 1010) + 1);

        // ランダムIDのポケモン情報を取得
        const pokemonPromises = randomIds.map(id =>
            axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`).then(response => response.data)
        );
        const pokemonData = await Promise.all(pokemonPromises);

        // 正解を選ぶ
        const correctPokemon = pokemonData[0];
        const correctName = (await axios.get(correctPokemon.species.url)).data.names.find(
            name => name.language.name === 'ja'
        ).name;

        // 他の選択肢も日本語名に変換
        const options = await Promise.all(
            pokemonData.map(async pokemon => {
                const speciesData = await axios.get(pokemon.species.url);
                return speciesData.data.names.find(name => name.language.name === 'ja').name;
            })
        );

        // データを返す
        res.json({
            correct: correctName,
            options: options.sort(() => Math.random() - 0.5), // シャッフル
            image: correctPokemon.sprites.front_default,
        });
    } catch (error) {
        console.error("APIエラー:", error);
        res.status(500).json({ error: 'ポケモンクイズの生成に失敗しました' });
    }
});

app.listen(port, () => {
    console.log(`サーバーが http://localhost:${port} で起動しました`);
});
