import React from 'react';

const ENCOURAGEMENTS = [
  { text: "Vos poumons vous disent merci 🫁", delay: "0s", duration: "16s", top: "15%", left: "10%", scale: "1.0" },
  { text: "Respirez la liberté 🌬️", delay: "2s", duration: "14s", top: "42%", left: "40%", scale: "1.05" },
  { text: "Chaque jour est une victoire ✨", delay: "4s", duration: "18s", top: "75%", left: "12%", scale: "0.95" },
  { text: "Un souffle de vie retrouvé 💨", delay: "1s", duration: "15s", top: "28%", left: "52%", scale: "1.0" },
  { text: "NeuralConsult à vos côtés 🩺", delay: "3s", duration: "17s", top: "60%", left: "6%", scale: "1.02" },
  { text: "Libre et en pleine santé 🌟", delay: "5s", duration: "19s", top: "82%", left: "45%", scale: "0.98" },
];

const Auth3DScene = () => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {/* Background Soft Gradients */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '120%',
        height: '120%',
        background: 'radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(16, 185, 129, 0.08) 0%, transparent 40%)',
        zIndex: -1
      }} />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float-around {
          0% {
            transform: translate(0, 0) rotate(0deg);
          }
          33% {
            transform: translate(15px, -25px) rotate(2deg);
          }
          66% {
            transform: translate(-10px, 15px) rotate(-2deg);
          }
          100% {
            transform: translate(0, 0) rotate(0deg);
          }
        }
        
        .floating-encouragement {
          animation-name: float-around;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.05);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          transition: transform 0.3s ease;
        }
      `}} />

      {ENCOURAGEMENTS.map((item, index) => (
        <div
          key={index}
          className="floating-encouragement"
          style={{
            position: 'absolute',
            top: item.top,
            left: item.left,
            padding: '0.75rem 1.25rem',
            borderRadius: '50px',
            background: 'rgba(255, 255, 255, 0.65)',
            color: '#1e3a8a',
            fontWeight: '600',
            fontSize: '0.9rem',
            animationDelay: item.delay,
            animationDuration: item.duration,
            transform: `scale(${item.scale})`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap'
          }}
        >
          {item.text}
        </div>
      ))}
    </div>
  );
};

export default Auth3DScene;
