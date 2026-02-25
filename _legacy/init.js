const table = document.getElementById("scoreTable");
const startScoreSelect = document.getElementById("startScore");
const playerCountSelect = document.getElementById("playerCount");

let podium = []; // ordre d’arrivée : [p1, p4, p2]

function buildAll() {
    podium = [];
    table.innerHTML = "";
    buildHeader();
    buildScoreRow();
    buildRounds();
    resetAll();
}

function buildHeader() {
    const tr1 = document.createElement("tr");
    tr1.className = "headerRow1";

    const tr2 = document.createElement("tr");
    tr2.className = "headerRow2";

    const th = document.createElement("th");
    th.rowSpan = 2;
    th.textContent = "Manche";
    tr1.appendChild(th);

    const players = parseInt(playerCountSelect.value);

    for (let p = 1; p <= players; p++) {
        const thPlayer = document.createElement("th");
        thPlayer.colSpan = 3;
        thPlayer.textContent = "Joueur " + p;
        thPlayer.classList.add("playerHeader");
        tr1.appendChild(thPlayer);

        ["L1", "L2", "L3"].forEach(l => {
            const thL = document.createElement("th");
            thL.textContent = l;
            tr2.appendChild(thL);
        });
    }

    table.appendChild(tr1);
    table.appendChild(tr2);
}

function buildScoreRow() {
    const players = parseInt(playerCountSelect.value);
    const tr = document.createElement("tr");
    tr.className = "scoreRow";

    const tdLabel = document.createElement("td");
    tdLabel.textContent = "Score";
    tr.appendChild(tdLabel);

    for (let p = 0; p < players; p++) {
        const td = document.createElement("td");
        td.colSpan = 3;
        td.className = "scoreCell";
        tr.appendChild(td);
    }

    table.appendChild(tr);
}

function buildRounds() {
    const players = parseInt(playerCountSelect.value);

    for (let i = 1; i <= 50; i++) {
        const tr = document.createElement("tr");

        const tdManche = document.createElement("td");
        tdManche.textContent = i;
        tr.appendChild(tdManche);

        for (let p = 0; p < players; p++) {
            for (let j = 0; j < 3; j++) {
                const td = document.createElement("td");
                const input = document.createElement("input");
                input.type = "number";
                input.min = 0;
                input.oninput = updateScores;
                td.appendChild(input);
                tr.appendChild(td);
            }
        }

        table.appendChild(tr);
    }
}

function resetAll() {
    podium = [];
    const start = startScoreSelect.value;

    document.querySelectorAll(".scoreCell").forEach(c => {
        c.textContent = start;
        c.classList.remove("winner");
    });

    document.querySelectorAll(".playerHeader").forEach(h => {
        h.classList.remove("gold", "silver", "bronze");
    });

    document.querySelectorAll("input[type='number']").forEach(i => i.value = "");
}

function updateScores() {
    const players = parseInt(playerCountSelect.value);
    let scores = Array(players).fill(parseInt(startScoreSelect.value));

    const rows = [...table.querySelectorAll("tr")].slice(3);

    rows.forEach(row => {
        const inputs = [...row.querySelectorAll("input")];

        for (let p = 0; p < players; p++) {
            const before = scores[p];
            let roundTotal = 0;

            const base = p * 3;
            for (let j = 0; j < 3; j++) {
                const val = parseInt(inputs[base + j].value);
                if (!isNaN(val)) roundTotal += val;
            }

            if (roundTotal > scores[p]) {
                scores[p] = before;
            } else {
                scores[p] -= roundTotal;
            }
        }
    });

    document.querySelectorAll(".scoreCell").forEach((c, i) => {
        const old = parseInt(c.textContent);
        c.textContent = scores[i];

        if (scores[i] === 0 && old !== 0) {
            c.classList.add("winner");

            if (!podium.includes(i)) {
                podium.push(i);
                applyPodium();
            }

            setTimeout(() => c.classList.remove("winner"), 700);
        }
    });
}

function applyPodium() {
    const headers = document.querySelectorAll(".playerHeader");

    podium.forEach((p, index) => {
        if (index === 0) headers[p].classList.add("gold");
        if (index === 1) headers[p].classList.add("silver");
        if (index === 2) headers[p].classList.add("bronze");
    });
}

buildAll();