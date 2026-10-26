
const startButton = document.getElementById("start-button");

startButton.addEventListener("click", () => {
    document.querySelector("#game h1").textContent =
        "Urban Life 3D";

    document.querySelector("#game p").textContent =
        "Game berhasil dijalankan!";

    startButton.textContent = "Berhasil!";
    startButton.disabled = true;

    console.log("JavaScript berhasil dijalankan.");
});
