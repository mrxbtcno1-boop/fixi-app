import React from 'react';
import Svg, { G, Path, Circle, Ellipse, Rect, Line, Text as SvgText } from 'react-native-svg';
import { FixiState } from './FixiStates';

interface Props {
  size: number;
  state: FixiState;
  accessory?: string;
}

export function FixiSvg({ size, state, accessory = 'scarf' }: Props) {
  // For level accessories, use the accessory-specific renderer
  if (accessory !== 'scarf') {
    return renderAccessory(size, accessory);
  }
  // Otherwise render the state
  return renderState(size, state);
}

function renderState(size: number, state: FixiState) {
  switch (state) {
    case 'welcome': return <WelcomeFixi size={size} />;
    case 'empathy': return <EmpathyFixi size={size} />;
    case 'excited': return <ExcitedFixi size={size} />;
    case 'coaching': return <CoachingFixi size={size} />;
    case 'celebrating': return <CelebratingFixi size={size} />;
    case 'motivated': return <MotivatedFixi size={size} />;
    case 'sad': return <SadFixi size={size} />;
    case 'worried': return <WorriedFixi size={size} />;
    case 'proud': return <ProudFixi size={size} />;
    case 'sleeping': return <SleepingFixi size={size} />;
    case 'thinking': return <ThinkingFixi size={size} />;
    case 'strong': return <StrongFixi size={size} />;
    default: return <WelcomeFixi size={size} />;
  }
}

function renderAccessory(size: number, accessory: string) {
  switch (accessory) {
    case 'headband': return <FixiFighter size={size} />;
    case 'cape': return <FixiWarrior size={size} />;
    case 'shield': return <FixiChampion size={size} />;
    case 'sword_shield': return <FixiChampion size={size} />;
    case 'crown': return <FixiLegend size={size} />;
    default: return <FixiStarter size={size} />;
  }
}

// ===== WELCOME =====
function WelcomeFixi({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 1.1} viewBox="0 0 100 110" fill="none">
      {/* Tail */}
      <G>
        <Path d="M20 78 Q8 65 12 52 Q18 42 28 48 Q25 58 28 70Z" fill="#E8734A" />
        <Path d="M12 52Q18 45 25 48Q22 50 21 54Z" fill="#FFF5E6" opacity={0.6} />
      </G>
      {/* Body */}
      <Ellipse cx={50} cy={82} rx={22} ry={20} fill="#F4845F" />
      <Ellipse cx={50} cy={86} rx={15} ry={14} fill="#FFF5E6" />
      {/* Scarf */}
      <Path d="M35 70Q50 75 65 70Q66 78 63 79Q50 81 37 79Q34 78 35 70Z" fill="#00D4AA" />
      {/* Head */}
      <Ellipse cx={50} cy={50} rx={25} ry={22} fill="#F4845F" />
      {/* Left ear */}
      <Path d="M30 32L25 12L40 28Z" fill="#F4845F" />
      <Path d="M31 31L27 16L38 28Z" fill="#FF9B7A" />
      {/* Right ear */}
      <Path d="M70 32L75 12L60 28Z" fill="#F4845F" />
      <Path d="M69 31L73 16L62 28Z" fill="#FF9B7A" />
      {/* Eyes */}
      <Ellipse cx={41} cy={47} rx={5} ry={5.5} fill="#fff" />
      <Ellipse cx={59} cy={47} rx={5} ry={5.5} fill="#fff" />
      <Ellipse cx={42.5} cy={46.5} rx={3} ry={3.5} fill="#2D1B4E" />
      <Ellipse cx={60.5} cy={46.5} rx={3} ry={3.5} fill="#2D1B4E" />
      <Circle cx={43.5} cy={45} r={1.2} fill="#fff" />
      <Circle cx={61.5} cy={45} r={1.2} fill="#fff" />
      {/* Nose */}
      <Ellipse cx={50} cy={54} rx={2.5} ry={1.8} fill="#2D1B4E" />
      {/* Mouth */}
      <Path d="M46 57Q50 61 54 57" stroke="#2D1B4E" strokeWidth={1.2} fill="none" strokeLinecap="round" />
      {/* Cheek blush */}
      <Ellipse cx={36} cy={54} rx={4} ry={2.5} fill="#FF9B7A" opacity={0.5} />
      <Ellipse cx={64} cy={54} rx={4} ry={2.5} fill="#FF9B7A" opacity={0.5} />
      {/* Waving arm */}
      <Path d="M73 75Q78 65 80 58" stroke="#F4845F" strokeWidth={6} strokeLinecap="round" fill="none" />
      <Circle cx={80} cy={56} r={4} fill="#F4845F" />
      <Path d="M27 75Q22 70 18 64" stroke="#F4845F" strokeWidth={6} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

// ===== EMPATHY =====
function EmpathyFixi({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 1.1} viewBox="0 0 100 110" fill="none">
      <G><Path d="M20 78Q8 65 12 52Q18 42 28 48Q25 58 28 70Z" fill="#E8734A" /></G>
      <Ellipse cx={50} cy={82} rx={22} ry={20} fill="#F4845F" />
      <Ellipse cx={50} cy={86} rx={15} ry={14} fill="#FFF5E6" />
      <Path d="M35 70Q50 75 65 70Q66 78 63 79Q50 81 37 79Q34 78 35 70Z" fill="#00D4AA" />
      <Ellipse cx={50} cy={50} rx={25} ry={22} fill="#F4845F" />
      <Path d="M30 32L25 12L40 28Z" fill="#F4845F" />
      <Path d="M70 32L75 12L60 28Z" fill="#F4845F" />
      {/* Soft caring eyes */}
      <Ellipse cx={41} cy={47} rx={5} ry={4.5} fill="#fff" />
      <Ellipse cx={59} cy={47} rx={5} ry={4.5} fill="#fff" />
      <Ellipse cx={42} cy={47} rx={3} ry={3} fill="#2D1B4E" />
      <Ellipse cx={60} cy={47} rx={3} ry={3} fill="#2D1B4E" />
      <Circle cx={43} cy={45.5} r={1.2} fill="#fff" />
      <Circle cx={61} cy={45.5} r={1.2} fill="#fff" />
      {/* Gentle eyebrows */}
      <Path d="M36 42Q41 40 46 42" stroke="#D4714A" strokeWidth={1.2} fill="none" strokeLinecap="round" />
      <Path d="M54 42Q59 40 64 42" stroke="#D4714A" strokeWidth={1.2} fill="none" strokeLinecap="round" />
      <Ellipse cx={50} cy={54} rx={2.5} ry={1.8} fill="#2D1B4E" />
      <Path d="M46 57Q50 60 54 57" stroke="#2D1B4E" strokeWidth={1.2} fill="none" strokeLinecap="round" />
      <Ellipse cx={36} cy={54} rx={4} ry={2.5} fill="#FF9B7A" opacity={0.5} />
      <Ellipse cx={64} cy={54} rx={4} ry={2.5} fill="#FF9B7A" opacity={0.5} />
      {/* Hand on heart */}
      <Path d="M38 75Q34 72 35 68" stroke="#F4845F" strokeWidth={6} strokeLinecap="round" fill="none" />
      <Circle cx={36} cy={76} r={4} fill="#F4845F" />
      {/* Heart */}
      <Path d="M37 74Q35 71 37 69Q39 67 41 69L37 74Z" fill="#FF6B6B" opacity={0.8} />
    </Svg>
  );
}

// ===== EXCITED =====
function ExcitedFixi({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 1.1} viewBox="0 0 100 110" fill="none">
      <G><Path d="M20 78Q8 65 12 52Q18 42 28 48Q25 58 28 70Z" fill="#E8734A" /></G>
      <Ellipse cx={50} cy={82} rx={22} ry={20} fill="#F4845F" />
      <Ellipse cx={50} cy={86} rx={15} ry={14} fill="#FFF5E6" />
      <Path d="M35 70Q50 75 65 70Q66 78 63 79Q50 81 37 79Q34 78 35 70Z" fill="#00D4AA" />
      <Ellipse cx={50} cy={50} rx={25} ry={22} fill="#F4845F" />
      <Path d="M30 32L25 12L40 28Z" fill="#F4845F" />
      <Path d="M70 32L75 12L60 28Z" fill="#F4845F" />
      {/* Big excited eyes */}
      <Ellipse cx={41} cy={46} rx={6} ry={7} fill="#fff" />
      <Ellipse cx={59} cy={46} rx={6} ry={7} fill="#fff" />
      <Ellipse cx={42.5} cy={45} rx={4} ry={4.5} fill="#2D1B4E" />
      <Ellipse cx={60.5} cy={45} rx={4} ry={4.5} fill="#2D1B4E" />
      <Circle cx={44} cy={43} r={1.8} fill="#fff" />
      <Circle cx={62} cy={43} r={1.8} fill="#fff" />
      <Ellipse cx={50} cy={54} rx={2.5} ry={1.8} fill="#2D1B4E" />
      {/* Big open smile */}
      <Path d="M43 57Q50 65 57 57" stroke="#2D1B4E" strokeWidth={1.5} fill="#FF9B7A" strokeLinecap="round" />
      <Ellipse cx={36} cy={53} rx={4} ry={2.5} fill="#FF9B7A" opacity={0.6} />
      <Ellipse cx={64} cy={53} rx={4} ry={2.5} fill="#FF9B7A" opacity={0.6} />
      {/* Arms up */}
      <Path d="M27 75Q20 60 18 50" stroke="#F4845F" strokeWidth={6} strokeLinecap="round" fill="none" />
      <Path d="M73 75Q80 60 82 50" stroke="#F4845F" strokeWidth={6} strokeLinecap="round" fill="none" />
      {/* Stars */}
      <SvgText x={12} y={42} fontSize={10} fill="#FFD700">{'\u2726'}</SvgText>
      <SvgText x={82} y={38} fontSize={8} fill="#00D4AA">{'\u2726'}</SvgText>
      <SvgText x={72} y={25} fontSize={12} fill="#FFD700">{'\u2605'}</SvgText>
      <SvgText x={20} y={20} fontSize={7} fill="#7B61FF">{'\u2726'}</SvgText>
    </Svg>
  );
}

// ===== COACHING =====
function CoachingFixi({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 1.1} viewBox="0 0 100 110" fill="none">
      <G><Path d="M20 78Q8 65 12 52Q18 42 28 48Q25 58 28 70Z" fill="#E8734A" /></G>
      <Ellipse cx={50} cy={82} rx={22} ry={20} fill="#F4845F" />
      <Ellipse cx={50} cy={86} rx={15} ry={14} fill="#FFF5E6" />
      <Path d="M35 70Q50 75 65 70Q66 78 63 79Q50 81 37 79Q34 78 35 70Z" fill="#00D4AA" />
      <Ellipse cx={50} cy={50} rx={25} ry={22} fill="#F4845F" />
      <Path d="M30 32L25 12L40 28Z" fill="#F4845F" />
      <Path d="M70 32L75 12L60 28Z" fill="#F4845F" />
      {/* Glasses */}
      <Rect x={33} y={42} width={14} height={12} rx={3} stroke="#2D1B4E" strokeWidth={1.5} fill="none" />
      <Rect x={53} y={42} width={14} height={12} rx={3} stroke="#2D1B4E" strokeWidth={1.5} fill="none" />
      <Line x1={47} y1={48} x2={53} y2={48} stroke="#2D1B4E" strokeWidth={1.5} />
      {/* Eyes behind glasses */}
      <Ellipse cx={40} cy={48} rx={3} ry={3.5} fill="#2D1B4E" />
      <Ellipse cx={60} cy={48} rx={3} ry={3.5} fill="#2D1B4E" />
      <Circle cx={41} cy={46.5} r={1} fill="#fff" />
      <Circle cx={61} cy={46.5} r={1} fill="#fff" />
      <Ellipse cx={50} cy={55} rx={2.5} ry={1.8} fill="#2D1B4E" />
      <Path d="M46 58Q50 61 54 58" stroke="#2D1B4E" strokeWidth={1.2} fill="none" strokeLinecap="round" />
      <Ellipse cx={36} cy={55} rx={3} ry={2} fill="#FF9B7A" opacity={0.4} />
      <Ellipse cx={64} cy={55} rx={3} ry={2} fill="#FF9B7A" opacity={0.4} />
      {/* Pointing arm */}
      <Path d="M73 78Q82 72 85 65" stroke="#F4845F" strokeWidth={6} strokeLinecap="round" fill="none" />
      <Circle cx={86} cy={64} r={3} fill="#F4845F" />
    </Svg>
  );
}

// ===== CELEBRATING =====
function CelebratingFixi({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 1.1} viewBox="0 0 100 110" fill="none">
      <G><Path d="M20 78Q8 65 12 52Q18 42 28 48Q25 58 28 70Z" fill="#E8734A" /></G>
      <Ellipse cx={50} cy={82} rx={22} ry={20} fill="#F4845F" />
      <Ellipse cx={50} cy={86} rx={15} ry={14} fill="#FFF5E6" />
      <Path d="M35 70Q50 75 65 70Q66 78 63 79Q50 81 37 79Q34 78 35 70Z" fill="#00D4AA" />
      <Ellipse cx={50} cy={50} rx={25} ry={22} fill="#F4845F" />
      <Path d="M30 32L25 12L40 28Z" fill="#F4845F" />
      <Path d="M70 32L75 12L60 28Z" fill="#F4845F" />
      {/* Party hat */}
      <Path d="M50 18L38 38L62 38Z" fill="#7B61FF" />
      <Circle cx={50} cy={16} r={3} fill="#FFD700" />
      <Line x1={42} y1={32} x2={58} y2={32} stroke="#00D4AA" strokeWidth={1.5} />
      {/* Happy squint eyes */}
      <Path d="M36 47Q41 43 46 47" stroke="#2D1B4E" strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d="M54 47Q59 43 64 47" stroke="#2D1B4E" strokeWidth={2} fill="none" strokeLinecap="round" />
      <Ellipse cx={50} cy={54} rx={2.5} ry={1.8} fill="#2D1B4E" />
      <Path d="M43 57Q50 65 57 57" stroke="#2D1B4E" strokeWidth={1.5} fill="#FF9B7A" strokeLinecap="round" />
      <Ellipse cx={36} cy={53} rx={5} ry={3} fill="#FF9B7A" opacity={0.5} />
      <Ellipse cx={64} cy={53} rx={5} ry={3} fill="#FF9B7A" opacity={0.5} />
      {/* Arms up */}
      <Path d="M27 78Q15 60 12 48" stroke="#F4845F" strokeWidth={6} strokeLinecap="round" fill="none" />
      <Path d="M73 78Q85 60 88 48" stroke="#F4845F" strokeWidth={6} strokeLinecap="round" fill="none" />
      {/* Confetti */}
      <Rect x={8} y={30} width={4} height={4} rx={1} fill="#00D4AA" rotation={30} origin="10, 32" />
      <Rect x={88} y={35} width={3} height={3} rx={1} fill="#FFD700" rotation={-20} origin="89, 36" />
      <Rect x={15} y={50} width={3} height={3} rx={1} fill="#7B61FF" rotation={45} origin="16, 51" />
      <Rect x={80} y={25} width={4} height={4} rx={1} fill="#FF6B6B" rotation={15} origin="82, 27" />
      <Circle cx={92} cy={55} r={2} fill="#00D4AA" />
      <Circle cx={5} cy={45} r={1.5} fill="#FFD700" />
    </Svg>
  );
}

// ===== MOTIVATED =====
function MotivatedFixi({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 1.1} viewBox="0 0 100 110" fill="none">
      <G><Path d="M20 78Q8 65 12 52Q18 42 28 48Q25 58 28 70Z" fill="#E8734A" /></G>
      <Ellipse cx={50} cy={82} rx={22} ry={20} fill="#F4845F" />
      <Ellipse cx={50} cy={86} rx={15} ry={14} fill="#FFF5E6" />
      <Path d="M35 70Q50 75 65 70Q66 78 63 79Q50 81 37 79Q34 78 35 70Z" fill="#00D4AA" />
      <Ellipse cx={50} cy={50} rx={25} ry={22} fill="#F4845F" />
      <Path d="M30 32L25 12L40 28Z" fill="#F4845F" />
      <Path d="M70 32L75 12L60 28Z" fill="#F4845F" />
      {/* Determined eyes */}
      <Ellipse cx={41} cy={47} rx={5} ry={5.5} fill="#fff" />
      <Ellipse cx={59} cy={47} rx={5} ry={5.5} fill="#fff" />
      <Ellipse cx={42.5} cy={46} rx={3.5} ry={4} fill="#2D1B4E" />
      <Ellipse cx={60.5} cy={46} rx={3.5} ry={4} fill="#2D1B4E" />
      <Circle cx={43.5} cy={44.5} r={1.3} fill="#fff" />
      <Circle cx={61.5} cy={44.5} r={1.3} fill="#fff" />
      {/* Determined brows */}
      <Line x1={35} y1={40} x2={46} y2={42} stroke="#D4714A" strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={65} y1={40} x2={54} y2={42} stroke="#D4714A" strokeWidth={1.5} strokeLinecap="round" />
      <Ellipse cx={50} cy={54} rx={2.5} ry={1.8} fill="#2D1B4E" />
      <Path d="M45 57Q50 62 55 57" stroke="#2D1B4E" strokeWidth={1.3} fill="none" strokeLinecap="round" />
      <Ellipse cx={36} cy={54} rx={4} ry={2.5} fill="#FF9B7A" opacity={0.4} />
      <Ellipse cx={64} cy={54} rx={4} ry={2.5} fill="#FF9B7A" opacity={0.4} />
      {/* Fist pump */}
      <Path d="M73 78Q82 65 84 55" stroke="#F4845F" strokeWidth={6} strokeLinecap="round" fill="none" />
      <Circle cx={84} cy={53} r={5} fill="#F4845F" />
      <Path d="M27 78Q22 72 20 65" stroke="#F4845F" strokeWidth={6} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

// ===== SAD =====
function SadFixi({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 1.1} viewBox="0 0 100 110" fill="none">
      <G><Path d="M20 85Q8 72 12 59Q18 49 28 55Q25 65 28 77Z" fill="#E8734A" /></G>
      <Ellipse cx={50} cy={85} rx={22} ry={18} fill="#F4845F" />
      <Ellipse cx={50} cy={88} rx={15} ry={13} fill="#FFF5E6" />
      <Path d="M35 73Q50 78 65 73Q66 80 63 81Q50 83 37 81Q34 80 35 73Z" fill="#00D4AA" opacity={0.7} />
      <Ellipse cx={50} cy={52} rx={25} ry={22} fill="#F4845F" />
      {/* Droopy ears */}
      <Path d="M30 38L20 22L38 40Z" fill="#F4845F" rotation={15} origin="30,38" />
      <Path d="M70 38L80 22L62 40Z" fill="#F4845F" rotation={-15} origin="70,38" />
      {/* Sad eyes */}
      <Ellipse cx={41} cy={50} rx={5} ry={5.5} fill="#fff" />
      <Ellipse cx={59} cy={50} rx={5} ry={5.5} fill="#fff" />
      <Ellipse cx={41} cy={51} rx={3} ry={3.5} fill="#2D1B4E" />
      <Ellipse cx={59} cy={51} rx={3} ry={3.5} fill="#2D1B4E" />
      <Circle cx={42} cy={49.5} r={1.2} fill="#fff" />
      <Circle cx={60} cy={49.5} r={1.2} fill="#fff" />
      {/* Sad eyebrows */}
      <Path d="M35 44Q40 46 46 44" stroke="#D4714A" strokeWidth={1.3} fill="none" strokeLinecap="round" />
      <Path d="M54 44Q60 46 65 44" stroke="#D4714A" strokeWidth={1.3} fill="none" strokeLinecap="round" />
      <Ellipse cx={50} cy={57} rx={2.5} ry={1.8} fill="#2D1B4E" />
      {/* Sad mouth */}
      <Path d="M44 62Q50 58 56 62" stroke="#2D1B4E" strokeWidth={1.3} fill="none" strokeLinecap="round" />
      <Ellipse cx={36} cy={56} rx={4} ry={2.5} fill="#FF9B7A" opacity={0.3} />
      <Ellipse cx={64} cy={56} rx={4} ry={2.5} fill="#FF9B7A" opacity={0.3} />
      {/* Tear */}
      <Path d="M46 52Q45 56 46 59" stroke="#7BB8E0" strokeWidth={1.5} fill="none" strokeLinecap="round" opacity={0.7} />
    </Svg>
  );
}

// ===== WORRIED =====
function WorriedFixi({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 1.1} viewBox="0 0 100 110" fill="none">
      <G><Path d="M20 78Q8 65 12 52Q18 42 28 48Q25 58 28 70Z" fill="#E8734A" /></G>
      <Ellipse cx={50} cy={82} rx={22} ry={20} fill="#F4845F" />
      <Ellipse cx={50} cy={86} rx={15} ry={14} fill="#FFF5E6" />
      <Path d="M35 70Q50 75 65 70Q66 78 63 79Q50 81 37 79Q34 78 35 70Z" fill="#00D4AA" />
      <Ellipse cx={50} cy={50} rx={25} ry={22} fill="#F4845F" />
      <Path d="M30 32L25 12L40 28Z" fill="#F4845F" />
      <Path d="M70 32L75 12L60 28Z" fill="#F4845F" />
      {/* Worried big eyes */}
      <Ellipse cx={41} cy={47} rx={6} ry={7} fill="#fff" />
      <Ellipse cx={59} cy={47} rx={6} ry={7} fill="#fff" />
      <Ellipse cx={41} cy={48} rx={3.5} ry={4} fill="#2D1B4E" />
      <Ellipse cx={59} cy={48} rx={3.5} ry={4} fill="#2D1B4E" />
      <Circle cx={42} cy={46} r={1.5} fill="#fff" />
      <Circle cx={60} cy={46} r={1.5} fill="#fff" />
      {/* Worried brows */}
      <Path d="M34 40Q40 43 47 41" stroke="#D4714A" strokeWidth={1.5} fill="none" strokeLinecap="round" />
      <Path d="M53 41Q60 43 66 40" stroke="#D4714A" strokeWidth={1.5} fill="none" strokeLinecap="round" />
      <Ellipse cx={50} cy={55} rx={2.5} ry={1.8} fill="#2D1B4E" />
      {/* Worried mouth */}
      <Path d="M44 59Q50 56 56 59" stroke="#2D1B4E" strokeWidth={1.3} fill="none" strokeLinecap="round" />
      {/* Sweat drop */}
      <Path d="M70 38Q72 42 70 46Q68 42 70 38Z" fill="#7BB8E0" opacity={0.7} />
      <Ellipse cx={36} cy={55} rx={4} ry={2.5} fill="#FF9B7A" opacity={0.4} />
      <Ellipse cx={64} cy={55} rx={4} ry={2.5} fill="#FF9B7A" opacity={0.4} />
    </Svg>
  );
}

// ===== PROUD =====
function ProudFixi({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 1.1} viewBox="0 0 100 110" fill="none">
      <G><Path d="M20 78Q8 65 12 52Q18 42 28 48Q25 58 28 70Z" fill="#E8734A" /></G>
      <Ellipse cx={50} cy={82} rx={22} ry={20} fill="#F4845F" />
      <Ellipse cx={50} cy={86} rx={15} ry={14} fill="#FFF5E6" />
      <Path d="M35 70Q50 75 65 70Q66 78 63 79Q50 81 37 79Q34 78 35 70Z" fill="#00D4AA" />
      <Ellipse cx={50} cy={50} rx={25} ry={22} fill="#F4845F" />
      <Path d="M30 32L25 12L40 28Z" fill="#F4845F" />
      <Path d="M70 32L75 12L60 28Z" fill="#F4845F" />
      {/* Crown */}
      <Path d="M35 28L38 18L44 25L50 14L56 25L62 18L65 28Z" fill="#FFD700" />
      <Circle cx={50} cy={16} r={2} fill="#FF6B6B" />
      <Circle cx={38} cy={20} r={1.5} fill="#7B61FF" />
      <Circle cx={62} cy={20} r={1.5} fill="#00D4AA" />
      {/* Confident eyes */}
      <Path d="M36 47Q41 44 46 47" stroke="#2D1B4E" strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d="M54 47Q59 44 64 47" stroke="#2D1B4E" strokeWidth={2} fill="none" strokeLinecap="round" />
      <Ellipse cx={50} cy={54} rx={2.5} ry={1.8} fill="#2D1B4E" />
      <Path d="M45 57Q50 62 55 57" stroke="#2D1B4E" strokeWidth={1.3} fill="none" strokeLinecap="round" />
      <Ellipse cx={36} cy={53} rx={4} ry={2.5} fill="#FF9B7A" opacity={0.5} />
      <Ellipse cx={64} cy={53} rx={4} ry={2.5} fill="#FF9B7A" opacity={0.5} />
      {/* Hands on hips */}
      <Path d="M28 78Q22 74 25 68" stroke="#F4845F" strokeWidth={6} strokeLinecap="round" fill="none" />
      <Path d="M72 78Q78 74 75 68" stroke="#F4845F" strokeWidth={6} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

// ===== SLEEPING =====
function SleepingFixi({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 1.1} viewBox="0 0 100 110" fill="none">
      {/* Sleeping Fixi curled up */}
      <G><Path d="M70 72Q85 60 82 48Q78 40 68 48Q72 55 70 65Z" fill="#E8734A" /></G>
      <Ellipse cx={50} cy={75} rx={30} ry={22} fill="#F4845F" />
      <Ellipse cx={50} cy={78} rx={22} ry={16} fill="#FFF5E6" />
      <Path d="M30 65Q50 70 70 65Q72 72 68 74Q50 76 32 74Q28 72 30 65Z" fill="#00D4AA" opacity={0.7} />
      <Ellipse cx={45} cy={60} rx={20} ry={18} fill="#F4845F" />
      {/* Closed eyes */}
      <Path d="M36 58Q40 56 44 58" stroke="#2D1B4E" strokeWidth={1.5} fill="none" strokeLinecap="round" />
      <Path d="M48 57Q52 55 56 57" stroke="#2D1B4E" strokeWidth={1.5} fill="none" strokeLinecap="round" />
      <Ellipse cx={43} cy={63} rx={2} ry={1.5} fill="#2D1B4E" />
      {/* Small ears */}
      <Path d="M30 48L25 33L38 45Z" fill="#F4845F" />
      <Path d="M58 46L65 32L55 44Z" fill="#F4845F" />
      <Ellipse cx={34} cy={61} rx={3} ry={2} fill="#FF9B7A" opacity={0.4} />
      <Ellipse cx={52} cy={61} rx={3} ry={2} fill="#FF9B7A" opacity={0.4} />
      {/* Zzz */}
      <SvgText x={62} y={45} fontSize={14} fontWeight="bold" fill="#7B61FF" opacity={0.8}>Z</SvgText>
      <SvgText x={72} y={35} fontSize={10} fontWeight="bold" fill="#7B61FF" opacity={0.5}>z</SvgText>
      <SvgText x={78} y={28} fontSize={7} fontWeight="bold" fill="#7B61FF" opacity={0.3}>z</SvgText>
    </Svg>
  );
}

// ===== THINKING =====
function ThinkingFixi({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 1.1} viewBox="0 0 100 110" fill="none">
      <G><Path d="M20 78Q8 65 12 52Q18 42 28 48Q25 58 28 70Z" fill="#E8734A" /></G>
      <Ellipse cx={50} cy={82} rx={22} ry={20} fill="#F4845F" />
      <Ellipse cx={50} cy={86} rx={15} ry={14} fill="#FFF5E6" />
      <Path d="M35 70Q50 75 65 70Q66 78 63 79Q50 81 37 79Q34 78 35 70Z" fill="#00D4AA" />
      <Ellipse cx={50} cy={50} rx={25} ry={22} fill="#F4845F" />
      <Path d="M30 32L25 12L40 28Z" fill="#F4845F" />
      <Path d="M70 32L75 12L60 28Z" fill="#F4845F" />
      {/* Looking up eyes */}
      <Ellipse cx={41} cy={46} rx={5} ry={5.5} fill="#fff" />
      <Ellipse cx={59} cy={46} rx={5} ry={5.5} fill="#fff" />
      <Ellipse cx={42} cy={44} rx={3} ry={3.5} fill="#2D1B4E" />
      <Ellipse cx={60} cy={44} rx={3} ry={3.5} fill="#2D1B4E" />
      <Circle cx={43} cy={42.5} r={1.2} fill="#fff" />
      <Circle cx={61} cy={42.5} r={1.2} fill="#fff" />
      <Ellipse cx={50} cy={54} rx={2.5} ry={1.8} fill="#2D1B4E" />
      <Path d="M46 58Q50 59 54 58" stroke="#2D1B4E" strokeWidth={1.2} fill="none" strokeLinecap="round" />
      <Ellipse cx={36} cy={54} rx={4} ry={2.5} fill="#FF9B7A" opacity={0.4} />
      <Ellipse cx={64} cy={54} rx={4} ry={2.5} fill="#FF9B7A" opacity={0.4} />
      {/* Hand on chin */}
      <Path d="M73 78Q78 70 76 62" stroke="#F4845F" strokeWidth={6} strokeLinecap="round" fill="none" />
      <Circle cx={75} cy={61} r={4} fill="#F4845F" />
      {/* Thought bubble */}
      <Circle cx={85} cy={38} r={8} fill="none" stroke="#8892B0" strokeWidth={1} strokeDasharray="2 2" />
      <Circle cx={82} cy={48} r={3} fill="none" stroke="#8892B0" strokeWidth={1} opacity={0.6} />
      <Circle cx={79} cy={53} r={1.5} fill="#8892B0" opacity={0.4} />
      <SvgText x={81} y={41} fontSize={8} fill="#8892B0">?</SvgText>
    </Svg>
  );
}

// ===== STRONG =====
function StrongFixi({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 1.1} viewBox="0 0 100 110" fill="none">
      <G><Path d="M20 78Q8 65 12 52Q18 42 28 48Q25 58 28 70Z" fill="#E8734A" /></G>
      <Ellipse cx={50} cy={82} rx={22} ry={20} fill="#F4845F" />
      <Ellipse cx={50} cy={86} rx={15} ry={14} fill="#FFF5E6" />
      <Path d="M35 70Q50 75 65 70Q66 78 63 79Q50 81 37 79Q34 78 35 70Z" fill="#00D4AA" />
      {/* Cape */}
      <Path d="M30 70Q25 85 30 100Q50 95 70 100Q75 85 70 70Q50 75 30 70Z" fill="#7B61FF" opacity={0.8} />
      <Ellipse cx={50} cy={50} rx={25} ry={22} fill="#F4845F" />
      <Path d="M30 32L25 12L40 28Z" fill="#F4845F" />
      <Path d="M70 32L75 12L60 28Z" fill="#F4845F" />
      {/* Confident squint */}
      <Path d="M36 47Q41 44 46 47" stroke="#2D1B4E" strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d="M54 47Q59 44 64 47" stroke="#2D1B4E" strokeWidth={2} fill="none" strokeLinecap="round" />
      <Ellipse cx={50} cy={54} rx={2.5} ry={1.8} fill="#2D1B4E" />
      <Path d="M44 57Q50 63 56 57" stroke="#2D1B4E" strokeWidth={1.5} fill="none" strokeLinecap="round" />
      <Ellipse cx={36} cy={53} rx={4} ry={2.5} fill="#FF9B7A" opacity={0.5} />
      <Ellipse cx={64} cy={53} rx={4} ry={2.5} fill="#FF9B7A" opacity={0.5} />
      {/* Flexing arm */}
      <Path d="M73 75Q82 62 78 50" stroke="#F4845F" strokeWidth={6} strokeLinecap="round" fill="none" />
      <Path d="M78 50Q82 48 84 52" stroke="#F4845F" strokeWidth={5} strokeLinecap="round" fill="none" />
      <Path d="M27 75Q18 68 20 60" stroke="#F4845F" strokeWidth={6} strokeLinecap="round" fill="none" />
      {/* Power sparkle */}
      <SvgText x={86} y={46} fontSize={8} fill="#FFD700">{'\u2726'}</SvgText>
    </Svg>
  );
}

// ===== LEVEL-UP ACCESSORIES =====

function FixiStarter({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 1.125} viewBox="0 0 80 90" fill="none">
      <Ellipse cx={40} cy={65} rx={18} ry={16} fill="#F4845F" />
      <Ellipse cx={40} cy={68} rx={12} ry={11} fill="#FFF5E6" />
      <Path d="M28 55Q40 59 52 55Q53 62 50 63Q40 65 30 63Q27 62 28 55Z" fill="#00D4AA" />
      <Ellipse cx={40} cy={40} rx={20} ry={18} fill="#F4845F" />
      <Path d="M24 26L20 10L32 23Z" fill="#F4845F" />
      <Path d="M56 26L60 10L48 23Z" fill="#F4845F" />
      <Ellipse cx={33} cy={38} rx={4} ry={4.5} fill="#fff" />
      <Ellipse cx={47} cy={38} rx={4} ry={4.5} fill="#fff" />
      <Ellipse cx={34.5} cy={37.5} rx={2.5} ry={3} fill="#2D1B4E" />
      <Ellipse cx={48.5} cy={37.5} rx={2.5} ry={3} fill="#2D1B4E" />
      <Circle cx={35.5} cy={36} r={1} fill="#fff" />
      <Circle cx={49.5} cy={36} r={1} fill="#fff" />
      <Ellipse cx={40} cy={44} rx={2} ry={1.5} fill="#2D1B4E" />
      <Path d="M37 47Q40 50 43 47" stroke="#2D1B4E" strokeWidth={1} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function FixiFighter({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 1.125} viewBox="0 0 80 90" fill="none">
      <Ellipse cx={40} cy={65} rx={18} ry={16} fill="#F4845F" />
      <Ellipse cx={40} cy={68} rx={12} ry={11} fill="#FFF5E6" />
      <Path d="M28 55Q40 59 52 55Q53 62 50 63Q40 65 30 63Q27 62 28 55Z" fill="#00D4AA" />
      <Ellipse cx={40} cy={40} rx={20} ry={18} fill="#F4845F" />
      <Path d="M24 26L20 10L32 23Z" fill="#F4845F" />
      <Path d="M56 26L60 10L48 23Z" fill="#F4845F" />
      {/* Stirnband */}
      <Path d="M22 32Q40 28 58 32" stroke="#00D4AA" strokeWidth={3} fill="none" strokeLinecap="round" />
      <Path d="M58 32Q62 36 60 42" stroke="#00D4AA" strokeWidth={3} fill="none" strokeLinecap="round" />
      <Ellipse cx={33} cy={38} rx={4} ry={4.5} fill="#fff" />
      <Ellipse cx={47} cy={38} rx={4} ry={4.5} fill="#fff" />
      <Ellipse cx={34.5} cy={37.5} rx={2.5} ry={3} fill="#2D1B4E" />
      <Ellipse cx={48.5} cy={37.5} rx={2.5} ry={3} fill="#2D1B4E" />
      <Circle cx={35.5} cy={36} r={1} fill="#fff" />
      <Circle cx={49.5} cy={36} r={1} fill="#fff" />
      <Ellipse cx={40} cy={44} rx={2} ry={1.5} fill="#2D1B4E" />
      <Path d="M37 47Q40 50 43 47" stroke="#2D1B4E" strokeWidth={1} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function FixiWarrior({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 1.125} viewBox="0 0 80 90" fill="none">
      <Ellipse cx={40} cy={65} rx={18} ry={16} fill="#F4845F" />
      <Ellipse cx={40} cy={68} rx={12} ry={11} fill="#FFF5E6" />
      {/* Cape */}
      <Path d="M25 55Q20 70 25 85Q40 80 55 85Q60 70 55 55Q40 59 25 55Z" fill="#7B61FF" opacity={0.7} />
      <Path d="M28 55Q40 59 52 55Q53 62 50 63Q40 65 30 63Q27 62 28 55Z" fill="#00D4AA" />
      <Ellipse cx={40} cy={40} rx={20} ry={18} fill="#F4845F" />
      <Path d="M24 26L20 10L32 23Z" fill="#F4845F" />
      <Path d="M56 26L60 10L48 23Z" fill="#F4845F" />
      <Ellipse cx={33} cy={38} rx={4} ry={4.5} fill="#fff" />
      <Ellipse cx={47} cy={38} rx={4} ry={4.5} fill="#fff" />
      <Ellipse cx={34.5} cy={37.5} rx={2.5} ry={3} fill="#2D1B4E" />
      <Ellipse cx={48.5} cy={37.5} rx={2.5} ry={3} fill="#2D1B4E" />
      <Circle cx={35.5} cy={36} r={1} fill="#fff" />
      <Circle cx={49.5} cy={36} r={1} fill="#fff" />
      <Ellipse cx={40} cy={44} rx={2} ry={1.5} fill="#2D1B4E" />
      <Path d="M37 47Q40 50 43 47" stroke="#2D1B4E" strokeWidth={1} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function FixiChampion({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 1.125} viewBox="0 0 80 90" fill="none">
      <Ellipse cx={40} cy={65} rx={18} ry={16} fill="#F4845F" />
      <Ellipse cx={40} cy={68} rx={12} ry={11} fill="#FFF5E6" />
      <Path d="M25 55Q20 70 25 85Q40 80 55 85Q60 70 55 55Q40 59 25 55Z" fill="#7B61FF" opacity={0.7} />
      <Path d="M28 55Q40 59 52 55Q53 62 50 63Q40 65 30 63Q27 62 28 55Z" fill="#00D4AA" />
      <Ellipse cx={40} cy={40} rx={20} ry={18} fill="#F4845F" />
      <Path d="M24 26L20 10L32 23Z" fill="#F4845F" />
      <Path d="M56 26L60 10L48 23Z" fill="#F4845F" />
      {/* Shield */}
      <Path d="M12 55L12 70Q12 80 20 82L12 55Z" fill="#00D4AA" />
      <Path d="M12 55L20 55L20 82Q12 80 12 70Z" fill="#00B894" />
      <Circle cx={16} cy={68} r={3} fill="#FFD700" />
      {/* Sword */}
      <Line x1={65} y1={50} x2={65} y2={80} stroke="#C0C0C0" strokeWidth={2.5} />
      <Line x1={60} y1={55} x2={70} y2={55} stroke="#8B7355" strokeWidth={2.5} />
      <Path d="M63 80L65 85L67 80Z" fill="#8B7355" />
      <Path d="M64 48L65 42L66 48Z" fill="#C0C0C0" />
      <Ellipse cx={33} cy={38} rx={4} ry={4.5} fill="#fff" />
      <Ellipse cx={47} cy={38} rx={4} ry={4.5} fill="#fff" />
      <Ellipse cx={34.5} cy={37.5} rx={2.5} ry={3} fill="#2D1B4E" />
      <Ellipse cx={48.5} cy={37.5} rx={2.5} ry={3} fill="#2D1B4E" />
      <Circle cx={35.5} cy={36} r={1} fill="#fff" />
      <Circle cx={49.5} cy={36} r={1} fill="#fff" />
      <Ellipse cx={40} cy={44} rx={2} ry={1.5} fill="#2D1B4E" />
      <Path d="M37 47Q40 50 43 47" stroke="#2D1B4E" strokeWidth={1} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function FixiLegend({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 1.125} viewBox="0 0 80 90" fill="none">
      <Ellipse cx={40} cy={65} rx={18} ry={16} fill="#F4845F" />
      <Ellipse cx={40} cy={68} rx={12} ry={11} fill="#FFF5E6" />
      {/* Golden cape */}
      <Path d="M25 55Q20 70 25 85Q40 80 55 85Q60 70 55 55Q40 59 25 55Z" fill="#FFD700" opacity={0.6} />
      <Path d="M28 55Q40 59 52 55Q53 62 50 63Q40 65 30 63Q27 62 28 55Z" fill="#00D4AA" />
      <Ellipse cx={40} cy={40} rx={20} ry={18} fill="#F4845F" />
      <Path d="M24 26L20 10L32 23Z" fill="#F4845F" />
      <Path d="M56 26L60 10L48 23Z" fill="#F4845F" />
      {/* Golden Crown */}
      <Path d="M27 23L29 14L35 20L40 10L45 20L51 14L53 23Z" fill="#FFD700" />
      <Circle cx={40} cy={12} r={2} fill="#FF6B6B" />
      <Circle cx={29} cy={16} r={1.5} fill="#7B61FF" />
      <Circle cx={51} cy={16} r={1.5} fill="#00D4AA" />
      {/* Golden shield */}
      <Path d="M10 55L10 70Q10 80 18 82L10 55Z" fill="#FFD700" />
      <Path d="M10 55L18 55L18 82Q10 80 10 70Z" fill="#DAA520" />
      <SvgText x={12} y={72} fontSize={8} fill="#fff">{'\u2605'}</SvgText>
      {/* Golden sword */}
      <Line x1={67} y1={50} x2={67} y2={80} stroke="#FFD700" strokeWidth={2.5} />
      <Line x1={62} y1={55} x2={72} y2={55} stroke="#DAA520" strokeWidth={2.5} />
      <Path d="M65 80L67 85L69 80Z" fill="#DAA520" />
      <Path d="M66 48L67 42L68 48Z" fill="#FFD700" />
      {/* Happy squint eyes */}
      <Path d="M29 38Q34 35 39 38" stroke="#2D1B4E" strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Path d="M41 38Q46 35 51 38" stroke="#2D1B4E" strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Ellipse cx={40} cy={44} rx={2} ry={1.5} fill="#2D1B4E" />
      <Path d="M36 47Q40 52 44 47" stroke="#2D1B4E" strokeWidth={1.2} fill="#FF9B7A" strokeLinecap="round" />
      {/* Glow */}
      <Circle cx={40} cy={50} r={35} fill="none" stroke="#FFD700" strokeWidth={0.5} opacity={0.3} />
    </Svg>
  );
}
