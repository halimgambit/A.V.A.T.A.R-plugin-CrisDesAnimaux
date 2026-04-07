import * as url from "url";
import fs from "fs";
import path from "path";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

let currentAudio = new Map();

export async function action(data, callback) {

	try {

		const tblActions = {
			getCry: () => getCry(data, data.client)
		};

		info("Phrase:", data.rawSentence);
		info("CrisDesAnimaux:", data.action.command, data.client);

		const action = tblActions[data.action.command];
		if (action) action();

	} catch (err) {

		error("CrisDesAnimaux:", err.message);

		if (data.client)
			Avatar.Speech.end(data.client);

	}

	callback();
}


/* ===============================
   NORMALIZE TEXTE
================================*/
function normalize(txt) {
	return txt
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/_/g, " ");
}


/* ===============================
   DETECTION CRI
================================*/
function getCry(data, client) {

	const sentence = normalize(data.rawSentence || data.action.sentence || "");

	const configPath = path.join(__dirname, "crisAnimaux.json");

	let config;

	try {
		config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
	} catch (error) {
		Avatar.speak("Erreur chargement configuration cris des animaux", client);
		return;
	}

	const animaux = config.animaux;

	const animalcry = Object.keys(animaux).find(animal =>
		sentence.includes(normalize(animal))
	);

	if (!animalcry) {

		Avatar.speak("Je ne connais pas cet animal.", client, () => {
			Avatar.Speech.end(client);
		});

		return;
	}

	playcry(animalcry.replace(/_/g," "), animaux[animalcry], client);

}


/* ===============================
   JOUER CRI
================================*/
function playcry(urlSound, client) {

    Avatar.stop(client);

    currentAudio.set(client, {
        url: urlSound,
        type: "url",
        mode: "before"
    });

	 const phrases = [
        "Écoute bien",
        "Voici le son",
        "Tu reconnais cet animal",
        "Attention",
        "Devine l'animal"
    ];

	 const phrase = phrases[Math.floor(Math.random() * phrases.length)];

    Avatar.speak(`${phrase}...`, client, () => {

        Avatar.play(urlSound, client, "url", "before");

    });
}