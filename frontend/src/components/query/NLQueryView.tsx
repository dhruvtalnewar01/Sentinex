import { useStore } from '../../stores/useIncidentStore'
import { useState } from 'react'
import { Search, Sparkles, AlertCircle } from 'lucide-react'
import { EXAMPLE_QUERIES } from '../../data/simulationData'
import ReactMarkdown from 'react-markdown'

export default function NLQueryView() {
  const { queryResult, submitQuery } = useStore()
  const [input, setInput] = useState('')

  const handleQuery = (q: string) => {
    if (!q.trim()) return
    setInput(q)
    submitQuery(q)
  }

  return (
    <div className="flex flex-col h-full bg-bg-primary overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border-subtle bg-bg-secondary shrink-0">
        <div className="text-[14px] font-bold tracking-widest text-text-muted flex items-center gap-2 mb-1"><Sparkles size={16} className="text-blue-info" /> NATURAL LANGUAGE QUERY</div>
        <div className="text-[11px] text-text-muted">Ask anything about your security posture in plain English. Queries run against the Neo4j knowledge graph.</div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
        <div className="w-full max-w-4xl flex flex-col gap-6">
          
          {/* Input Area */}
          <div className="relative w-full">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleQuery(input); } }}
              placeholder="E.g., Show all CRITICAL incidents in last 24h..."
              className="w-full bg-bg-secondary border border-border-subtle rounded-xl pl-4 pr-12 py-4 text-[13px] text-text-primary focus:outline-none focus:border-green-primary/50 resize-none transition-colors"
              rows={2}
            />
            <button 
              onClick={() => handleQuery(input)}
              className="absolute right-3 bottom-3 p-2 rounded-md bg-green-dim text-green-primary hover:bg-green-primary hover:text-bg-primary transition-colors cursor-pointer"
            >
              <Search size={16} />
            </button>
          </div>

          {/* Chips */}
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map((q, i) => (
              <button 
                key={i} 
                onClick={() => handleQuery(q)}
                className="px-3 py-1.5 bg-bg-tertiary border border-border-subtle rounded-full text-[10px] text-text-secondary hover:text-text-primary hover:border-border-accent transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Results Area */}
          {queryResult && (
            <div className="mt-4 animate-slide-up">
              <div className="text-[10px] tracking-widest text-text-muted font-bold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-info animate-pulse-dot" /> SENTINEL RESPONSE
              </div>
              
              {queryResult.loading ? (
                <div className="bg-bg-secondary border border-border-subtle rounded-xl p-6 text-center text-text-muted text-[12px] flex items-center justify-center gap-3">
                  <div className="w-4 h-4 border-2 border-text-muted/30 border-t-text-muted rounded-full animate-spin" /> Querying Neo4j Knowledge Graph...
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Markdown Answer */}
                  <div className="bg-bg-secondary border border-border-subtle rounded-xl p-6 text-[13px] text-text-primary prose prose-invert max-w-none prose-p:leading-relaxed prose-headings:mt-0 prose-headings:mb-4 prose-li:my-0.5">
                    <ReactMarkdown>{queryResult.answer}</ReactMarkdown>
                  </div>
                  
                  {/* Cypher Code Block */}
                  {queryResult.cypher && (
                    <div className="border border-border-subtle rounded-lg overflow-hidden bg-[#0d1117]">
                      <div className="bg-bg-tertiary px-4 py-2 border-b border-border-subtle text-[10px] font-mono text-text-muted flex justify-between">
                        <span>Generated Cypher Query</span>
                        <span>Neo4j Engine</span>
                      </div>
                      <pre className="p-4 m-0 text-[11px] font-mono text-blue-300 overflow-x-auto">
                        <code>{queryResult.cypher}</code>
                      </pre>
                    </div>
                  )}

                  {/* Anti-Hallucination Warning */}
                  <div className="flex items-center gap-2 text-[10px] text-text-muted px-2">
                    <AlertCircle size={12} /> Results derived directly from active simulation data state.
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
