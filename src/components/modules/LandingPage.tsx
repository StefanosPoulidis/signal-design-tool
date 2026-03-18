interface LandingPageProps {
  onNavigate: (module: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 font-serif leading-tight">
          Dynamic Signal Design with<br />Endogenous Future Efficacy
        </h1>
        <p className="text-lg text-gray-500 mb-2">
          A Behavioral-Channel MDP Framework for Signal Design
        </p>
        <p className="text-base text-gray-600">
          Stefanos Poulidis
        </p>
        <div className="flex justify-center gap-3 mt-6">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
            Working Paper 2026
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            Paper PDF coming soon
          </span>
        </div>
      </div>

      {/* Abstract */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Abstract</h2>
        <p className="text-gray-700 leading-relaxed text-sm font-serif">
          AI-generated recommendations can improve immediate decisions yet degrade the
          human operator's future competence through alert fatigue, skill erosion, or
          trust miscalibration. We formalize this trade-off as a finite-horizon
          constrained Markov decision process on an augmented state space that tracks
          both the physical system and operator efficacy. A factored transition kernel
          decomposes every signal's value into three channels&mdash;Immediate quality
          gain (<em>I</em>), action Displacement (<em>D</em>), and Efficacy drift
          (<em>E</em>)&mdash;providing the first operational decomposition that separates
          behavioral adaptation from physical dynamics. Structural results establish
          when harmful signaling is impossible, when it pervades the state space, and
          how large the welfare loss can be. Computational benchmarks on turbofan
          predictive-maintenance, microfounded trust, and multi-archetype scenarios
          show that drift-aware optimization improves lifecycle value by 2.6&ndash;39%
          over myopic signaling.
        </p>
      </div>

      {/* Plain Language Summary */}
      <div className="bg-primary-50 rounded-xl border border-primary-200 p-6 md:p-8 mb-8">
        <h2 className="text-lg font-semibold text-primary-900 mb-3">
          In Plain Language
        </h2>
        <p className="text-primary-800 leading-relaxed">
          Should your AI system always give its best recommendation? Surprisingly, no.
          When operators receive too many AI signals, they may stop paying attention,
          lose independent judgment, or become over-reliant. This paper provides a
          mathematical framework to decide <strong>when to signal and when to stay
          silent</strong>, balancing immediate decision quality against long-term
          operator competence. The key insight: the cost of eroding human capability
          can outweigh the benefit of providing accurate advice.
        </p>
      </div>

      {/* Interactive Modules Grid */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Explore the Framework
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {[
          {
            id: 'simulator',
            title: 'Should You Signal?',
            desc: 'Input your scenario parameters and check if AI advice helps or hurts.',
            color: 'bg-blue-50 border-blue-200 hover:border-blue-400',
            icon: '⚙️',
          },
          {
            id: 'ide',
            title: 'IDE Channel Decomposition',
            desc: 'See how a signal\'s value breaks down into Immediate, Displacement, and Efficacy channels.',
            color: 'bg-green-50 border-green-200 hover:border-green-400',
            icon: '\u{1F4CA}',
          },
          {
            id: 'scoreline',
            title: 'Multi-Level Signal Design',
            desc: 'Explore the score-line geometry for ordered signal menus with 2-5 intensity levels.',
            color: 'bg-purple-50 border-purple-200 hover:border-purple-400',
            icon: '\u{1F4C8}',
          },
          {
            id: 'archetypes',
            title: 'Operator Archetypes',
            desc: 'Compare 7 operator types: from Over-reliant to Skeptical.',
            color: 'bg-amber-50 border-amber-200 hover:border-amber-400',
            icon: '\u{1F465}',
          },
          {
            id: 'game',
            title: 'The Decision Game',
            desc: 'Play through scenarios and learn when silence beats advice.',
            color: 'bg-red-50 border-red-200 hover:border-red-400',
            icon: '\u{1F3AE}',
          },
          {
            id: 'deployment',
            title: 'Deployment Guide',
            desc: 'Walk through the 4-node deployment decision tree for your system.',
            color: 'bg-teal-50 border-teal-200 hover:border-teal-400',
            icon: '\u{1F680}',
          },
          {
            id: 'governance',
            title: 'Governance Frontier',
            desc: 'Explore the trade-off between signal caps and lifecycle value.',
            color: 'bg-indigo-50 border-indigo-200 hover:border-indigo-400',
            icon: '⚖️',
          },
        ].map(mod => (
          <button
            key={mod.id}
            onClick={() => onNavigate(mod.id)}
            className={`text-left rounded-xl border-2 p-5 transition-all ${mod.color} cursor-pointer`}
          >
            <div className="text-2xl mb-2">{mod.icon}</div>
            <h3 className="font-semibold text-gray-900 mb-1">{mod.title}</h3>
            <p className="text-sm text-gray-600">{mod.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
