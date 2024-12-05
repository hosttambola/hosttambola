const startDraw = async (req, res) => {
  const date = new Date();
  const time = date.toLocaleTimeString();

  try {
    const gameInfo = await redisClient.hgetall("game_info");
    let drawGap = parseInt(gameInfo.drawInterval, 10) * 1000;
    if (gameInfo.status === "done") {
      return res.status(400).json({ message: "Game Finished" });
    }

    if (drawInterval) {
      return res.status(400).json({ message: "Draw is already in progress!" });
    }

    // Generate unique random numbers for the draw
    const generateUniqueNumbers = (total) => {
      const numbers = Array.from({ length: total }, (_, i) => i + 1); // [1, 2, ..., 90]
      for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]]; // Shuffle numbers
      }
      return numbers;
    };

    const drawNumbers = generateUniqueNumbers(90); // Randomized array of 1 to 90

    // Start the draw process
    let drawIndex = 0;
    const drawNextNumber = async () => {
      if (drawIndex >= drawNumbers.length) {
        await endDraw(io, drawnNumbersKey);
        return;
      }

      const newNumber = drawNumbers[drawIndex];
      drawnNumbers.push(newNumber);
      await redisClient.set(drawnNumbersKey, JSON.stringify(drawnNumbers));

      const winners = await validateWinners(drawnNumbers);

      drawIndex++;
    };

    setTimeout(() => {
      drawNextNumber();
      drawInterval = setInterval(drawNextNumber, drawGap);
    }, 10000);

    res.status(200).json({ message: "Draw started successfully!" });
  } catch (error) {
    console.error("Error starting draw:", error);
  }
};
