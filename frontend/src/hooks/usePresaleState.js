'use client';

import { useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import { PRESALE_ADDRESSES, PRESALE_ABI, PRESALE_STATE, priceAt, nextStepAt, isSoldOut, closingTime } from '../config/presale';

/**
 * Hook partage de lecture de l'etat de la Presale on-chain.
 * Compatible avec la carte presale de l'accueil et la page /presale.
 */
export function usePresaleState(readProvider) {
  const [config, setConfig] = useState(null);
  const [global, setGlobal] = useState(null);
  const [now, setNow] = useState(() => BigInt(Math.floor(Date.now() / 1000)));

  // Horloge 1s pour le compte a rebours
  useEffect(() => {
    const id = setInterval(() => setNow(BigInt(Math.floor(Date.now() / 1000))), 1000);
    return () => clearInterval(id);
  }, []);

  const presale = useMemo(() => {
    if (!readProvider) return null;
    return new ethers.Contract(PRESALE_ADDRESSES.PRESALE, PRESALE_ABI, readProvider);
  }, [readProvider]);

  // Chargement initial de la configuration du contrat
  useEffect(() => {
    let cancelled = false;
    if (!presale) return;

    (async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const [
            presaleName, tokenDecimals, paymentDecimals, cap, basePrice,
            priceIncreaseBps, priceIncreasePeriod, tgeBps, vestingDuration,
            referralBps, maxExtensions, extensionDuration, startTime, tiers
          ] = await Promise.all([
            presale.presaleName(),
            presale.tokenDecimals(),
            presale.paymentTokenDecimals(),
            presale.presaleTokensCap(),
            presale.basePrice(),
            presale.priceIncreaseBps(),
            presale.priceIncreasePeriod(),
            presale.tgeBps(),
            presale.vestingDuration(),
            presale.referralBps(),
            presale.maxExtensions(),
            presale.extensionDuration(),
            presale.startTime(),
            presale.getVolumeBonusTiers(),
          ]);

          if (cancelled) return;
          setConfig({
            presaleName,
            tokenDecimals: Number(tokenDecimals),
            paymentDecimals: Number(paymentDecimals),
            cap,
            basePrice,
            priceIncreaseBps,
            priceIncreasePeriod,
            tgeBps,
            vestingDuration,
            referralBps,
            maxExtensions: Number(maxExtensions),
            extensionDuration,
            startTime,
            tierThresholds: [...tiers[0]],
            tierBps: [...tiers[1]],
          });
          return;
        } catch (err) {
          console.error('[usePresaleState] load error:', err);
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    })();

    return () => { cancelled = true; };
  }, [presale]);

  // Polling de l'etat global (raised, tokens vendus, etc.)
  useEffect(() => {
    let cancelled = false;
    if (!presale) return;

    const fetchGlobal = async () => {
      try {
        const [
          state, paused, endTime, tgeTimestamp, extensionsUsed,
          totalRaised, totalTokensOwed, depositedTokens, remainingTokens,
          currentPrice
        ] = await Promise.all([
          presale.state(),
          presale.paused(),
          presale.endTime(),
          presale.tgeTimestamp(),
          presale.extensionsUsed(),
          presale.totalRaised(),
          presale.totalTokensOwed(),
          presale.depositedTokens(),
          presale.remainingTokens(),
          presale.getCurrentPrice(),
        ]);

        if (cancelled) return;
        setGlobal({
          state: Number(state),
          paused,
          endTime,
          tgeTimestamp,
          extensionsUsed: Number(extensionsUsed),
          totalRaised,
          totalTokensOwed,
          depositedTokens,
          remainingTokens,
          currentPrice,
        });
      } catch (err) {
        console.error('[usePresaleState] global poll error:', err);
      }
    };

    fetchGlobal();
    const interval = setInterval(fetchGlobal, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [presale]);

  // Statut calcule
  const computedState = useMemo(() => {
    if (!config) return 'LOADING';
    if (now < config.startTime) return 'PENDING';
    if (global) {
      if (global.state === PRESALE_STATE.ENDED) return 'ENDED';
      // Heure passee mais start() pas encore execute par le Safe : la vente n'est pas ouverte.
      if (global.state === PRESALE_STATE.PENDING) return 'AWAITING_START';
      if (now > global.endTime) return 'FINALIZATION_PENDING';
      // Plafond atteint a la poussiere pres (finalisation auto seulement au wei pres) : meme regle que PresaleClient.
      if (isSoldOut(config, global, global.currentPrice)) return 'SOLD_OUT';
      if (global.paused) return 'PAUSED';
      return 'LIVE';
    }
    return 'PENDING';
  }, [config, global, now]);

  const countdownSeconds = useMemo(() => {
    if (!config) return 0n;
    if (now < config.startTime) {
      return config.startTime - now;
    }
    if (global && now < global.endTime) {
      return global.endTime - now;
    }
    return 0n;
  }, [config, global, now]);

  const currentPrice = config ? priceAt(config, now) : 0n;
  const nextT = config ? nextStepAt(config, now) : 0n;
  const nextPrice = config ? priceAt(config, nextT) : 0n;
  const nextStepSeconds = config && nextT > now ? nextT - now : 0n;
  // Prix de cloture (vente finalisee ou fin passee) : fige, ne suit plus l'horloge.
  const finalPrice = config && global ? priceAt(config, closingTime(global)) : 0n;

  return {
    config,
    global,
    now,
    computedState,
    finalPrice,
    countdownSeconds,
    currentPrice,
    nextPrice,
    nextStepSeconds,
  };
}
