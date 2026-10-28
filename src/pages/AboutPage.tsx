/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import {
  ShieldCheck,
  UserCheck,
  Award,
  Users,
  Code2,
  Cpu,
  Layers,
  Database,
  ExternalLink,
  Github
} from 'lucide-react';

interface TeamMember {
  name: string;
  rollNo: string;
  role: string;
  isLeader?: boolean;
  specialization: string;
  initials: string;
}

import { motion } from 'motion/react';

export const AboutPage: React.FC = () => {
  const teamMembers: TeamMember[] = [
    {
      name: 'Akshay Kumar',
      rollNo: '059',
      role: 'Team Leader',
      isLeader: true,
      specialization: 'Full-Stack Architecture & Security Verification Engine',
      initials: 'AK',
    },
    {
      name: 'Akshay Kumar',
      rollNo: '058',
      role: 'Core Developer',
      isLeader: false,
      specialization: 'OpenCV Computer Vision & Image Preprocessing Pipeline',
      initials: 'AK',
    },
    {
      name: 'Ankush Singh',
      rollNo: '084',
      role: 'Core Developer',
      isLeader: false,
      specialization: 'Tesseract OCR Text Extraction & Regex Normalization',
      initials: 'AS',
    },
    {
      name: 'Aniket Singh',
      rollNo: '076',
      role: 'Core Developer',
      isLeader: false,
      specialization: 'CNN Neural Network Modeling & Database Architecture',
      initials: 'AS',
    },
  ];

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Project Title Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl bg-gradient-to-b from-slate-900/80 to-slate-950 border border-slate-800 text-center space-y-4 shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <ShieldCheck className="w-4 h-4" />
          <span>Final Year Engineering Project</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Fake UPI Shield
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          AI-Based Fake UPI Payment Screenshot Detector using Computer Vision Preprocessing,
          Tesseract OCR Text Extraction, CNN Convolutional Classification, and Rule-Based Verification.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
          <span>Academic Project Evaluation</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>FinTech Cybersecurity & Fraud Prevention</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>Connected Full-Stack Application</span>
        </div>
      </motion.div>

      {/* Team Members Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold tracking-tight text-white">Project Development Team</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">4 Core Contributors</span>
        </div>

        {/* Responsive Card Grid with Motion Scroll-Triggered Cyber Stagger & Hover Elevation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {teamMembers.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30, scale: 0.94 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                delay: index * 0.12,
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{ y: -6, scale: 1.02 }}
              className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-4 relative group cursor-pointer overflow-hidden ${
                member.isLeader
                  ? 'bg-slate-900/70 border-emerald-500/50 hover:border-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.22)]'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60 hover:shadow-[0_0_20px_rgba(255,255,255,0.04)]'
              }`}
            >
              {/* Cyber Reticle Corner Brackets */}
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-slate-700 group-hover:border-emerald-400 transition-colors" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-slate-700 group-hover:border-emerald-400 transition-colors" />

              {/* Leader Indicator */}
              {member.isLeader ? (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded shadow-sm">
                    <Award className="w-3 h-3" />
                    <span>Lead</span>
                  </span>
                </div>
              ) : (
                <div className="absolute top-4 right-4 font-mono text-[10px] text-slate-600 group-hover:text-slate-400 transition-colors">
                  [0{index + 1}]
                </div>
              )}

              {/* Avatar and Primary Details */}
              <div className="space-y-3">
                <motion.div
                  whileHover={{ rotate: 6, scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg border transition-all duration-200 ${
                    member.isLeader
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                      : 'bg-slate-800/80 border-slate-700/60 text-slate-200 group-hover:border-slate-600'
                  }`}
                >
                  {member.initials}
                </motion.div>

                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                    <span>{member.name}</span>
                  </h3>

                  <div className="flex items-center gap-2 text-xs mt-1 text-slate-400">
                    <span className="font-mono text-emerald-400 font-semibold tabular-nums">
                      Roll: {member.rollNo}
                    </span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span>{member.role}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed pt-1 border-t border-slate-800/60">
                  {member.specialization}
                </p>
              </div>

              {/* Badge Footer */}
              <div className="pt-2 text-[11px] text-slate-500 font-mono flex items-center justify-between">
                <span>{member.isLeader ? 'Lead & Architecture' : 'Module Engineer'}</span>
                <span className="text-[10px] text-emerald-400/80 opacity-0 group-hover:opacity-100 transition-opacity">
                  ACTIVE
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Project Overview & Research Context with Scroll-Triggered Reveal */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4"
      >
        {/* Project Objectives */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 space-y-3 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-slate-700 group-hover:border-emerald-400 transition-colors" />
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Project Objective & Motivation</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            With the rapid rise of Unified Payments Interface (UPI) transactions across India, counterfeit
            screenshot generators and spoof APKs have become a widespread threat against merchants and small
            businesses. Fake UPI Shield addresses this problem through a multi-tiered forensic engine that
            scrutinizes visual layout patterns, character kerning, UTR authenticity, and convolutional features.
          </p>
        </div>

        {/* Technical Architecture Summary */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 space-y-3 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-slate-700 group-hover:border-emerald-400 transition-colors" />
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Key Technology Stack</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 font-mono">
            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">Frontend</span>
              <span>React 19 + Vite</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">Backend API</span>
              <span>FastAPI & Python 3.11</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">Vision & OCR</span>
              <span>OpenCV + Tesseract</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">Deep Learning</span>
              <span>TensorFlow / Keras CNN</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
