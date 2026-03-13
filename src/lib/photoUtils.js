/**
 * Utility for managing and selecting real reward photos.
 */

export const REWARD_PHOTOS = [
  's_ananth.jpeg',
  's_divjetlagparis.JPG',
  's_divyabirthday.JPG',
  's_fenton.PNG',
  's_icecreammilkbomb.jpeg',
  's_jamesbondparty.JPG',
  's_jetlag.JPG',
  's_leahmacaroon.jpeg',
  's_natechezpanise.jpeg',
  's_noodlehands.jpeg',
  's_oaklandgroupvikramwedding.jpg',
  's_parisbridge.JPG',
  's_roadsidefruit.jpg',
  's_tej and cookies.jpeg',
  's_vr.jpeg',
  's_yellowflowers.jpeg'
];

export const getRandomPhoto = (seed) => {
  // If we have a seed (like exercise name + date), use it for consistency within a day
  let index;
  if (seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    index = Math.abs(hash) % REWARD_PHOTOS.length;
  } else {
    index = Math.floor(Math.random() * REWARD_PHOTOS.length);
  }
  
  return `photo-incentive/${REWARD_PHOTOS[index]}`;
};
