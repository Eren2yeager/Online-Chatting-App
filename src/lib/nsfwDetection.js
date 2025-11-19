import * as nsfwjs from 'nsfwjs';
import { createCanvas, loadImage } from 'canvas';

// Use global to persist across hot reloads in development
const globalForNSFW = global;

if (!globalForNSFW.nsfwModel) {
  globalForNSFW.nsfwModel = null;
  globalForNSFW.nsfwModelLoading = false;
  globalForNSFW.nsfwLoadPromise = null;
}

// Load model once and reuse
async function loadModel() {
  // If model is already loaded, return it
  if (globalForNSFW.nsfwModel) {
    return globalForNSFW.nsfwModel;
  }
  
  // If model is currently loading, wait for it
  if (globalForNSFW.nsfwModelLoading && globalForNSFW.nsfwLoadPromise) {
    return globalForNSFW.nsfwLoadPromise;
  }
  
  // Start loading the model
  globalForNSFW.nsfwModelLoading = true;
  globalForNSFW.nsfwLoadPromise = (async () => {
    try {
      console.log('Loading NSFW detection model...');
      
      globalForNSFW.nsfwModel = await nsfwjs.load();
      console.log('NSFW model loaded successfully');
      return globalForNSFW.nsfwModel;
    } catch (error) {
      console.error('Failed to load NSFW model:', error);
      globalForNSFW.nsfwModel = null;
      throw error;
    } finally {
      globalForNSFW.nsfwModelLoading = false;
    }
  })();
  
  return globalForNSFW.nsfwLoadPromise;
}

/**
 * Check if image content is safe
 * @param {Buffer} imageBuffer - Image buffer to check
 * @param {number} threshold - NSFW threshold (0-1, default 0.5)
 * @returns {Promise<{isSafe: boolean, predictions: object, nsfwScore: number}>}
 */
export async function checkImageSafety(imageBuffer, threshold = 0.5) {
  try {
    const nsfwModel = await loadModel();
    
    // Convert buffer to image using canvas
    const img = await loadImage(imageBuffer);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    // Get predictions
    const predictions = await nsfwModel.classify(canvas);
    
    // Calculate NSFW score (Porn + Hentai + Sexy)
    const nsfwScore = predictions.reduce((score, pred) => {
      if (['Porn', 'Hentai', 'Sexy'].includes(pred.className)) {
        return score + pred.probability;
      }
      return score;
    }, 0);
    
    const isSafe = nsfwScore < threshold;
    
    const predictionObj = predictions.reduce((acc, pred) => {
      acc[pred.className] = pred.probability;
      return acc;
    }, {});
    
    console.log('NSFW Detection:', {
      isSafe,
      nsfwScore: nsfwScore.toFixed(3),
      predictions: predictionObj
    });
    
    return {
      isSafe,
      nsfwScore,
      predictions: predictionObj,
    };
  } catch (error) {
    console.error('NSFW detection error:', error);
    
    // If it's a TensorFlow variable registration error, clear and allow retry
    if (error.message && error.message.includes('already registered')) {
      console.log('⚠️  TensorFlow model conflict detected. Clearing cache...');
      globalForNSFW.nsfwModel = null;
      globalForNSFW.nsfwModelLoading = false;
      globalForNSFW.nsfwLoadPromise = null;
      
      // Return safe for this upload to avoid blocking, but log the issue
      console.warn('⚠️  Allowing upload due to model conflict. Please restart server to fix permanently.');
      return {
        isSafe: true,
        nsfwScore: 0,
        predictions: {},
        warning: 'Model conflict - restart server recommended'
      };
    }
    
    // On other errors, reject upload to be safe
    console.error('❌ Rejecting upload due to NSFW detection error');
    return {
      isSafe: false,
      nsfwScore: 1,
      predictions: {},
      error: error.message
    };
  }
}
