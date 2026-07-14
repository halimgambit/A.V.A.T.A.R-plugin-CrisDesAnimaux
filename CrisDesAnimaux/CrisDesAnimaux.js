import * as url from "url";
import fs from "fs";
import path from "path";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const PATH_SOUND = path.join(__dirname, "animaux");

export async function init() {
    await Avatar.lang.addPluginPak('CrisDesAnimaux');
    if (Avatar.static && typeof Avatar.static.set === 'function') {
        Avatar.static.set(PATH_SOUND);
    }
}

export async function action(data, callback) {
    try {
        const L = await Avatar.lang.getPak('CrisDesAnimaux', data.language);

        const tblActions = {
            getCry: () => getCry(data, data.client, data.toClient || data.client, L)
        };

        info("CrisDesAnimaux :", data.action.command, "from", data.client, "to", data.toClient);

        if (tblActions[data.action.command]) {
            await tblActions[data.action.command]();
        }

   } catch (err) {
		if (data.client) Avatar.Speech.end(data.client);
		if (err.message) error(err.message);
	}

    callback();
}

const normalize = (txt) => {
    return txt
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/_/g, " ");
};

const getCry = async (data, client, toClient, L) => {
    const sentence = normalize(data.rawSentence || data.action.sentence || "");

    try {
        const fichiers = fs.readdirSync(PATH_SOUND);
        const fichierTrouve = fichiers.find(fichier => {
            const nomAnimal = normalize(path.basename(fichier, path.extname(fichier)));
            return sentence.includes(nomAnimal);
        });

        if (!fichierTrouve) {
    info("Animal non reconnu dans la phrase :", sentence);
    return Avatar.speak(L.get("speech.noFile"), client, () => Avatar.Speech.end(client));
}

        const serverIp = Config.http.ip;
        const serverPort = Config.http.port;
        const soundUrl = `http://${serverIp}:${serverPort}/${encodeURIComponent(fichierTrouve)}`;

        const phrase = L.get("speech.sound");

        info("Animal trouvé :", fichierTrouve, "| URL :", soundUrl);
        info(phrase);

         Avatar.speak(phrase, client, () => {
        Avatar.static.set(PATH_SOUND, () => {
        Avatar.play(soundUrl, toClient, "url", 'after');
        Avatar.Speech.end(client);
    });
});
    } catch (err) {
        error("Erreur lecture dossier animaux:", err.message || err);
        Avatar.speak(L.get("speech.errorAccess"), client, () => Avatar.Speech.end(client));
    }
};
