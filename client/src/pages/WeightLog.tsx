import { useState } from "react";
import { useLocation } from "wouter";
import { useLogWeight, useWeightHistory } from "@/hooks/use-weight";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

export default function WeightLog() {
  const [weight, setWeight] = useState("");
  const [, setLocation] = useLocation();
  const { mutate: logWeight, isPending } = useLogWeight();
  const { data: history } = useWeightHistory();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;
    
    logWeight(
      { weight: parseFloat(weight), date: new Date() },
      { onSuccess: () => setLocation("/dashboard") }
    );
  };

  // Prepare chart data
  const chartData = history?.map(log => ({
    date: format(new Date(log.date), "MMM dd"),
    weight: log.weight
  })).reverse() || [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
       <header className="p-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-bold text-lg">Log Weight</h1>
      </header>

      <main className="flex-1 p-6 max-w-lg mx-auto w-full space-y-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">What's the scale say today?</h2>
            <p className="text-muted-foreground">Consistency is key. Don't worry about daily fluctuations.</p>
          </div>
          
          <div className="flex items-center justify-center gap-2">
             <Input 
               type="number" 
               step="0.1" 
               className="text-center text-4xl h-20 w-40 font-display font-bold" 
               placeholder="0.0"
               value={weight}
               onChange={(e) => setWeight(e.target.value)}
               autoFocus
             />
             <span className="text-xl font-bold text-muted-foreground pt-4">kg</span>
          </div>

          <Button type="submit" size="lg" className="w-full text-lg" disabled={!weight || isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : "Save Log"}
          </Button>
        </form>

        {chartData.length > 0 && (
          <Card className="p-6">
            <h3 className="font-bold mb-4">Progress History</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                   <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                   <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                   <Tooltip />
                   <Line type="monotone" dataKey="weight" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
