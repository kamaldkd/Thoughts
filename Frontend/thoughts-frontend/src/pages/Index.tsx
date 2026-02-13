import { Link } from "react-router-dom";
import { ArrowRight, Feather } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { CreateThoughtModal } from "@/components/CreateThoughtModal";
import { useState } from "react";

const Index = () => {
  const [createOpen, setCreateOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="relative flex-1 flex items-center justify-center min-h-screen overflow-hidden">
        <img
          src={heroBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-30 dark:opacity-15"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />

        <div className="relative z-10 text-center px-6 max-w-2xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-border/60 bg-card/60 backdrop-blur-sm">
            <Feather className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground font-medium">
              A new kind of social
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-semibold tracking-tight leading-[1.1] mb-6">
            A place where
            <br />
            <span className="text-primary">thoughts breathe.</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-md mx-auto mb-10 leading-relaxed">
            Share what matters. Slow down. Connect with intention.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/feed"
              className="inline-flex items-center gap-2 h-12 px-8 rounded-full bg-primary text-primary-foreground font-medium transition-all duration-300 hover:opacity-90 hover:gap-3"
            >
              Explore Thoughts
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/feed"
              state={{ openCreate: true }}
              className="inline-flex items-center h-12 px-8 rounded-full border border-border bg-card/60 backdrop-blur-sm font-medium transition-all duration-300 hover:bg-secondary"
            >
                Create a Thought
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-8">
          {[
            {
              title: "Express",
              desc: "Share thoughts as text, images, or videos — your way.",
            },
            {
              title: "Connect",
              desc: "Find like-minded souls in a calmer, more thoughtful space.",
            },
            {
              title: "Reflect",
              desc: "A feed designed to slow you down, not speed you up.",
            },
          ].map((item, i) => (
            <div
              key={item.title}
              className="text-center animate-fade-in"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <CreateThoughtModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
};

export default Index;
