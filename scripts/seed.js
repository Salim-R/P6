/**
 * Remplit la base avec un compte de demonstration et un catalogue d'exemple.
 *
 *   npm run seed          ajoute ce qui manque, sans toucher a l'existant
 *   npm run seed -- --reset   vide d'abord les sauces du compte de demo
 *
 * Le script est idempotent : le relancer ne cree pas de doublons.
 */
require('dotenv').config();

const bcrypt = require('bcrypt');
const CryptoJS = require('crypto-js');
const mongoose = require('mongoose');

const connectDatabase = require('../config/database');
const Sauce = require('../models/Sauce');
const User = require('../models/User');

const DEMO = { email: 'demo@piiquante.fr', password: 'Demo1234' };

const image = (id) => `https://images.unsplash.com/${id}?q=80&w=900&auto=format&fit=crop`;

const CATALOGUE = [
  {
    name: 'Braise du Yucatán',
    manufacturer: 'Casa Milagro',
    mainPepper: 'Habanero',
    heat: 8,
    description:
      "Habaneros rôtis au feu de bois, jus d'orange amère et une pointe d'ail confit. " +
      'La chaleur monte lentement puis tient longtemps, sans jamais couvrir le fruit.',
    imageUrl: image('photo-1700619773778-f02b45ca0616'),
  },
  {
    name: 'Fumée Verte',
    manufacturer: 'Atelier Pilar',
    mainPepper: 'Jalapeño',
    heat: 4,
    description:
      'Jalapeños fumés au bois de hêtre, coriandre fraîche et citron vert. ' +
      'Une sauce douce et herbacée, pensée pour les tacos et le poisson grillé.',
    imageUrl: image('photo-1519666213631-be6e024eac6a'),
  },
  {
    name: 'Rouge Absolu',
    manufacturer: 'Forge & Feu',
    mainPepper: 'Carolina Reaper',
    heat: 10,
    description:
      "À manier avec prudence. Carolina Reaper pur, vinaigre de cidre et rien d'autre. " +
      'Quelques gouttes suffisent pour transformer un plat entier.',
    imageUrl: image('photo-1519420638722-a2a5749c32be'),
  },
  {
    name: 'Mangue Piquante',
    manufacturer: 'Casa Milagro',
    mainPepper: 'Scotch Bonnet',
    heat: 6,
    description:
      'Mangue mûre, scotch bonnet et gingembre frais. Le sucre du fruit arrive en premier, ' +
      'la chaleur suit juste derrière. Parfaite sur du poulet grillé.',
    imageUrl: image('photo-1697026993856-261121bb5025'),
  },
  {
    name: 'Nuit Andalouse',
    manufacturer: 'Bodega Serrano',
    mainPepper: 'Piment de Padrón',
    heat: 3,
    description:
      "Padrón, huile d'olive et paprika fumé. Plus aromatique que brûlante, " +
      'elle accompagne les tapas et les œufs sans écraser le reste.',
    imageUrl: image('photo-1697026993860-e1bed73a1934'),
  },
  {
    name: 'Tempête de Ghost',
    manufacturer: 'Forge & Feu',
    mainPepper: 'Bhut Jolokia',
    heat: 9,
    description:
      'Ghost pepper, tomate rôtie et mélasse. Une chaleur franche et immédiate, ' +
      'adoucie par une base sucrée qui la rend étonnamment utilisable.',
    imageUrl: image('photo-1617908484787-b52cc0ce5c9a'),
  },
  {
    name: 'Ail Noir & Chipotle',
    manufacturer: 'Atelier Pilar',
    mainPepper: 'Chipotle',
    heat: 5,
    description:
      "Ail noir fermenté et chipotle en adobo. Profonde, presque umami, " +
      'elle se marie particulièrement bien avec les viandes longuement cuites.',
    imageUrl: image('photo-1617908484187-84ef53cdcede'),
  },
  {
    name: 'Citron Brûlant',
    manufacturer: 'Bodega Serrano',
    mainPepper: 'Piment oiseau',
    heat: 7,
    description:
      'Piment oiseau, citron confit et poivre de Timut. Vive et acidulée, ' +
      'elle réveille un poisson blanc ou une salade de lentilles.',
    imageUrl: image('photo-1638324396229-43d56a415ef3'),
  },
];

const hashEmail = (email) =>
  CryptoJS.HmacSHA256(email, process.env.CRYPTOJS_EMAIL).toString();

async function main() {
  const reset = process.argv.includes('--reset');

  if (!process.env.CRYPTOJS_EMAIL) {
    throw new Error('CRYPTOJS_EMAIL doit etre renseignee dans le .env');
  }

  await connectDatabase();

  // 1. Compte de demonstration
  const emailHash = hashEmail(DEMO.email);
  let user = await User.findOne({ email: emailHash });

  if (user) {
    console.log('Compte de demonstration deja present');
  } else {
    user = await User.create({
      email: emailHash,
      password: await bcrypt.hash(DEMO.password, 10),
    });
    console.log(`Compte de demonstration cree : ${DEMO.email} / ${DEMO.password}`);
  }

  // 2. Catalogue
  if (reset) {
    const { deletedCount } = await Sauce.deleteMany({ userId: user._id.toString() });
    console.log(`${deletedCount} sauce(s) supprimee(s)`);
  }

  let ajoutees = 0;

  for (const sauce of CATALOGUE) {
    // On evite les doublons si le script est relance.
    const existe = await Sauce.findOne({ name: sauce.name });
    if (existe) continue;

    await Sauce.create({
      ...sauce,
      userId: user._id.toString(),
      likes: 0,
      dislikes: 0,
      usersLiked: [],
      usersDisliked: [],
    });
    ajoutees += 1;
  }

  const total = await Sauce.countDocuments();
  console.log(`${ajoutees} sauce(s) ajoutee(s) — ${total} au catalogue`);
}

main()
  .catch((error) => {
    console.error('Echec du remplissage :', error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
