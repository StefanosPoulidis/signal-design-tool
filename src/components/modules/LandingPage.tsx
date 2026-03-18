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

      {/* How to use this tool */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 md:p-8 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          How to Use This Tool
        </h2>
        <p className="text-gray-700 leading-relaxed text-sm mb-3">
          This interactive platform lets you explore the paper's framework hands-on.
          Each module below corresponds to a key result. Adjust parameters with the
          sliders, observe how the math changes in real time, and build intuition
          for when AI advice helps vs. hurts.
        </p>
        <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
          <li><strong>Start with "Should You Signal?"</strong> to check if your scenario falls in the safe or harmful region.</li>
          <li><strong>Use "IDE Channels"</strong> to understand <em>why</em> signaling helps or hurts by decomposing the effect into three channels.</li>
          <li><strong>Explore "Multi-Level Design"</strong> to see how choosing between different signal intensities changes the optimal policy.</li>
          <li><strong>Compare "Operator Types"</strong> to see how the same signal affects different kinds of human operators.</li>
        </ol>
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
            desc: 'The core diagnostic: input your scenario parameters and instantly see whether AI advice helps or hurts over time. Tests both the sharp and observable prevalence conditions from the paper.',
            color: 'bg-blue-50 border-blue-200 hover:border-blue-400',
          },
          {
            id: 'ide',
            title: 'IDE Channel Decomposition',
            desc: 'Decompose any signal\'s value into its three fundamental channels: Immediate quality gain (I), action Displacement (D), and Efficacy drift (E). See exactly which channel dominates.',
            color: 'bg-green-50 border-green-200 hover:border-green-400',
          },
          {
            id: 'scoreline',
            title: 'Multi-Level Signal Design',
            desc: 'Design an ordered menu of signal intensities (from silence to full recommendation) and visualize the score-line geometry that determines which level is optimal at each shadow price.',
            color: 'bg-purple-50 border-purple-200 hover:border-purple-400',
          },
          {
            id: 'archetypes',
            title: 'Operator Archetypes',
            desc: 'Compare 7 operator behavioral profiles from the paper: Over-reliant, Alert-fatigued, Forward-looking, Compliant, Capacity-limited, Noisy, and Skeptical. See how each responds differently to signals.',
            color: 'bg-amber-50 border-amber-200 hover:border-amber-400',
          },
        ].map(mod => (
          <button
            key={mod.id}
            onClick={() => onNavigate(mod.id)}
            className={`text-left rounded-xl border-2 p-5 transition-all ${mod.color} cursor-pointer`}
          >
            <h3 className="font-semibold text-gray-900 mb-2">{mod.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{mod.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
