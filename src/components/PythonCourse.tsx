import React, { useState } from 'react';
import { BookOpen, Terminal, Code, Cpu, ChevronRight, CheckCircle, ArrowLeft } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  concept: string;
  description: string;
  pythonCode: string;
  task: string;
}

const LESSONS: Lesson[] = [
  {
    id: "lesson_1",
    title: "1. The Gunslinger (Variables & Objects)",
    concept: "Dictionaries and Classes",
    description: "In our TypeScript game, the player's stats are stored in an object. In Python, you can start by representing the player as a Dictionary, and later upgrade it to a Class.",
    pythonCode: `# Using a Dictionary
player = {
    "name": "Wyatt Earp",
    "health": 100,
    "max_health": 100,
    "gold": 50,
    "inventory": []
}

# Accessing data
print(f"{player['name']} has {player['health']} HP.")

# Using a Class (Object-Oriented)
class Player:
    def __init__(self, name):
        self.name = name
        self.health = 100
        self.max_health = 100
        self.gold = 50
        self.inventory = []

    def take_damage(self, amount):
        self.health -= amount
        print(f"{self.name} took {amount} damage!")

my_hero = Player("Doc Holliday")
my_hero.take_damage(20)`,
    task: "Open a Python environment (like IDLE or Replit). Write a Class for an 'Enemy' with health and damage variables."
  },
  {
    id: "lesson_2",
    title: "2. The Frontier Map (Lists & Loops)",
    concept: "Lists (Arrays) and For-Loops",
    description: "To build a map with multiple towns, we need a list of locations. In Python, Lists are incredibly powerful.",
    pythonCode: `import random

# A List of town names
town_names = ["Gallows Ridge", "Tumbleweed", "Armadillo", "Valentine"]

# Let's generate a list of dictionaries representing our map
map_locations = []

for name in town_names:
    town = {
        "name": name,
        "type": random.choice(["boomtown", "ghost_town", "outpost"]),
        "danger_level": random.randint(1, 5)
    }
    map_locations.append(town)

# Print out our map
print("--- FRONTIER MAP ---")
for loc in map_locations:
    print(f"{loc['name']} ({loc['type']}) - Danger: {loc['danger_level']}")`,
    task: "Create a list of 3 weapons (e.g., 'Revolver', 'Rifle', 'Shotgun'). Loop through the list and print each weapon's name."
  },
  {
    id: "lesson_3",
    title: "3. The Shootout (Functions & Random)",
    concept: "Functions (def) and Logic (if/else)",
    description: "Combat requires logic. We need functions that take inputs (like an attacker and defender) and calculate the outcome using random numbers.",
    pythonCode: `import random

def attack(attacker_name, defender_name, hit_chance, min_dmg, max_dmg):
    print(f"\\n--- {attacker_name} draws their weapon! ---")
    
    # Generate a random number between 1 and 100
    roll = random.randint(1, 100)
    
    if roll <= hit_chance:
        # It's a hit! Calculate damage.
        damage = random.randint(min_dmg, max_dmg)
        print(f"💥 HIT! {defender_name} takes {damage} damage.")
        return damage
    else:
        print(f"💨 MISS! {attacker_name}'s shot went wide.")
        return 0

# Let's test the function
bandit_hp = 50
damage_dealt = attack("Player", "Bandit", hit_chance=75, min_dmg=10, max_dmg=25)
bandit_hp -= damage_dealt

print(f"Bandit has {bandit_hp} HP remaining.")`,
    task: "Write a function called 'heal' that takes a current_hp and max_hp, adds 20 to current_hp without exceeding max_hp, and returns the new hp."
  },
  {
    id: "lesson_4",
    title: "4. The Game Loop (While Loops)",
    concept: "While Loops and User Input",
    description: "Every game needs a loop that keeps running until the player dies or quits. In a text-based Python game, we use a 'while' loop.",
    pythonCode: `player_hp = 100
game_running = True

print("Welcome to the Badlands.")

while game_running and player_hp > 0:
    print(f"\\n[HP: {player_hp}]")
    print("1. Travel to town")
    print("2. Rest at camp (-10 HP from cold, but time passes)")
    print("3. Quit game")
    
    # Get user input
    choice = input("What do you want to do? (1/2/3): ")
    
    if choice == "1":
        print("You saddle up and ride into town.")
    elif choice == "2":
        print("You freeze through the night...")
        player_hp -= 10
    elif choice == "3":
        print("You hang up your hat. Goodbye.")
        game_running = False
    else:
        print("Invalid choice, partner.")

if player_hp <= 0:
    print("You died on the trail. Game Over.")`,
    task: "Combine what you've learned! Make a small game loop where the player can choose to 'fight' (calls the attack function) or 'run'."
  }
];

export const PythonCourse: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeLesson, setActiveLesson] = useState<string>(LESSONS[0].id);

  const currentLesson = LESSONS.find(l => l.id === activeLesson) || LESSONS[0];

  return (
    <div className="lg:col-span-12 w-full h-full min-h-[80vh] flex flex-col md:flex-row gap-6 p-4">
      
      {/* Sidebar / Curriculum */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <div className="bg-[#2b1b10] border-4 border-[#593c24]/50 p-4 rounded text-[#ebdcb9] shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <BookOpen size={100} />
          </div>
          
          <button 
            onClick={onClose}
            className="text-[10px] uppercase font-bold text-amber-500 hover:text-amber-300 mb-4 flex items-center gap-1 transition-colors"
          >
            <ArrowLeft size={12} /> Back to Main Menu
          </button>

          <h2 className="text-xl font-serif font-black uppercase tracking-widest mb-1">
            Python Frontier
          </h2>
          <p className="text-xs font-sans text-[#a98f71] mb-6">
            Learn to build this RPG in Python
          </p>

          <div className="space-y-2">
            {LESSONS.map((lesson) => (
              <button
                key={lesson.id}
                onClick={() => setActiveLesson(lesson.id)}
                className={`w-full text-left p-3 rounded-sm border transition-all ${
                  activeLesson === lesson.id 
                    ? 'bg-[#4a2e1b] border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.1)] text-amber-200' 
                    : 'bg-[#1c120a] border-[#3a2717] hover:border-[#593c24] text-[#a98f71]'
                }`}
              >
                <div className="font-serif font-bold text-sm tracking-wide">{lesson.title}</div>
                <div className="font-mono text-[9px] uppercase mt-1 opacity-80 flex items-center gap-1">
                  <Terminal size={10} /> {lesson.concept}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#1c120a] border border-[#3a2717] p-4 rounded text-center text-[#a98f71]">
          <Cpu size={24} className="mx-auto mb-2 opacity-50" />
          <h3 className="text-sm font-bold uppercase tracking-wider font-serif text-[#ebdcb9]">How to run this code?</h3>
          <p className="text-xs mt-2">
            Go to <b>Replit.com</b> or download Python from <b>Python.org</b> to run these scripts on your computer.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full md:w-2/3 bg-[#ebdcb9] border-8 border-[#cfbfa0] border-double rounded-sm shadow-2xl p-6 flex flex-col font-sans relative">
        <div className="border-b-2 border-stone-800/20 pb-4 mb-6">
          <h1 className="text-3xl font-serif font-black text-stone-900 tracking-tight">
            {currentLesson.title}
          </h1>
          <p className="text-stone-700 mt-2 font-medium leading-relaxed">
            {currentLesson.description}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          <div className="bg-[#1e1e1e] rounded-md overflow-hidden shadow-xl border border-stone-800">
            <div className="bg-[#2d2d2d] px-4 py-2 border-b border-[#404040] flex items-center gap-2">
              <Code size={14} className="text-sky-400" />
              <span className="text-xs font-mono text-stone-300">script.py</span>
            </div>
            <pre className="p-4 text-[13px] font-mono text-stone-300 overflow-x-auto leading-relaxed">
              <code>{currentLesson.pythonCode}</code>
            </pre>
          </div>

          <div className="bg-amber-100/50 border border-amber-300/50 p-5 rounded-md">
            <h4 className="text-xs font-bold uppercase tracking-widest text-amber-900 mb-2 flex items-center gap-2">
              <CheckCircle size={14} className="text-amber-600" />
              Your Mission
            </h4>
            <p className="text-stone-800 text-sm">
              {currentLesson.task}
            </p>
          </div>
        </div>
        
      </div>
    </div>
  );
};
