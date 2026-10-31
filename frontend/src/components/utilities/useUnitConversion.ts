import { useState, useId } from 'react';
import toast from 'react-hot-toast';
import {
  kgToLbs,
  lbsToKg,
  kgToStoneLbs,
  stoneLbsToKg,
  cmToInches,
  inchesToCm,
  cmToFeetInches,
  feetInchesToCm,
  kmToMiles,
  milesToKm,
  paceKmToPaceMiles,
  paceToSpeedKmh,
  speedKmhToPace,
  kmhToMph,
  parsePace,
  formatPace,
} from '../../utils/fitnessCalculators';

export function useUnitConversion() {
  const [kgVal, setKgVal] = useState('75');
  const [lbsVal, setLbsVal] = useState('165.35');
  const [stonesVal, setStonesVal] = useState('11');
  const [stoneLbsVal, setStoneLbsVal] = useState('11.3');

  const [cmVal, setCmVal] = useState('178');
  const [inVal, setInVal] = useState('70.08');
  const [feetVal, setFeetVal] = useState('5');
  const [feetInVal, setFeetInVal] = useState('10.1');

  const [kmVal, setKmVal] = useState('10');
  const [miVal, setMiVal] = useState('6.21');

  const [paceMin, setPaceMin] = useState('5');
  const [paceSec, setPaceSec] = useState('0');
  const [paceMiMin, setPaceMiMin] = useState('8');
  const [paceMiSec, setPaceMiSec] = useState('3');
  const [speedKmhVal, setSpeedKmhVal] = useState('12');
  const [speedMphVal, setSpeedMphVal] = useState('7.46');

  const input1Id = useId();
  const input2Id = useId();

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copiado: ${text} (${label})`);
    } catch {
      toast.error('No se pudo copiar. Selecciona el resultado para copiarlo manualmente.');
    }
  };

  const handleKgChange = (val: string) => {
    setKgVal(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setLbsVal(String(kgToLbs(num)));
      const st = kgToStoneLbs(num);
      setStonesVal(String(st.stones));
      setStoneLbsVal(String(st.pounds));
    }
  };

  const handleLbsChange = (val: string) => {
    setLbsVal(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      const kg = lbsToKg(num);
      setKgVal(String(kg));
      const st = kgToStoneLbs(kg);
      setStonesVal(String(st.stones));
      setStoneLbsVal(String(st.pounds));
    }
  };

  const handleStoneChange = (st: string, lb: string) => {
    setStonesVal(st);
    setStoneLbsVal(lb);
    const numSt = parseFloat(st) || 0;
    const numLb = parseFloat(lb) || 0;
    const kg = stoneLbsToKg(numSt, numLb);
    setKgVal(String(kg));
    setLbsVal(String(kgToLbs(kg)));
  };

  const handleCmChange = (val: string) => {
    setCmVal(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setInVal(String(cmToInches(num)));
      const ftIn = cmToFeetInches(num);
      setFeetVal(String(ftIn.feet));
      setFeetInVal(String(ftIn.inches));
    }
  };

  const handleInchesChange = (val: string) => {
    setInVal(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      const cm = inchesToCm(num);
      setCmVal(String(cm));
      const ftIn = cmToFeetInches(cm);
      setFeetVal(String(ftIn.feet));
      setFeetInVal(String(ftIn.inches));
    }
  };

  const handleFeetInchesChange = (ft: string, inc: string) => {
    setFeetVal(ft);
    setFeetInVal(inc);
    const numFt = parseFloat(ft) || 0;
    const numIn = parseFloat(inc) || 0;
    const cm = feetInchesToCm(numFt, numIn);
    setCmVal(String(cm));
    setInVal(String(cmToInches(cm)));
  };

  const handleKmChange = (val: string) => {
    setKmVal(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setMiVal(String(kmToMiles(num)));
    }
  };

  const handleMilesChange = (val: string) => {
    setMiVal(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setKmVal(String(milesToKm(num)));
    }
  };

  const handlePaceKmChange = (m: string, s: string) => {
    setPaceMin(m);
    setPaceSec(s);
    const paceDec = parsePace(parseInt(m, 10) || 0, parseInt(s, 10) || 0);
    if (paceDec > 0) {
      const paceMiDec = paceKmToPaceMiles(paceDec);
      const [miMin, miSec] = formatPace(paceMiDec).split(':');
      setPaceMiMin(miMin);
      setPaceMiSec(String(Number(miSec)));

      const spdKmh = paceToSpeedKmh(paceDec);
      setSpeedKmhVal(String(spdKmh));
      setSpeedMphVal(String(kmhToMph(spdKmh)));
    }
  };

  const handleSpeedKmhChange = (val: string) => {
    setSpeedKmhVal(val);
    const spd = parseFloat(val);
    if (!isNaN(spd) && spd > 0) {
      setSpeedMphVal(String(kmhToMph(spd)));
      const pace = speedKmhToPace(spd);
      const [minutes, seconds] = formatPace(pace).split(':');
      setPaceMin(minutes);
      setPaceSec(String(Number(seconds)));

      const paceMi = paceKmToPaceMiles(pace);
      const [mileMinutes, mileSeconds] = formatPace(paceMi).split(':');
      setPaceMiMin(mileMinutes);
      setPaceMiSec(String(Number(mileSeconds)));
    }
  };

  return {
    kgVal,
    lbsVal,
    stonesVal,
    stoneLbsVal,
    cmVal,
    inVal,
    feetVal,
    feetInVal,
    kmVal,
    miVal,
    paceMin,
    paceSec,
    paceMiMin,
    paceMiSec,
    speedKmhVal,
    speedMphVal,
    input1Id,
    input2Id,
    copyToClipboard,
    handleKgChange,
    handleLbsChange,
    handleStoneChange,
    handleCmChange,
    handleInchesChange,
    handleFeetInchesChange,
    handleKmChange,
    handleMilesChange,
    handlePaceKmChange,
    handleSpeedKmhChange,
  };
}
