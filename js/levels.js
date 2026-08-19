// levels.js - Contains the comprehensive Vim curriculum structure and exercises with subtopics
const VIM_LEVELS = [
  {
    id: "basic-vim",
    name: "1. Basic Vim",
    description: "Learn normal vs insert mode and the core directional movements on the home row.",
    challenges: [
      {
        subtopic: "modes",
        instructions: "Vim has modes. Normal mode is for navigating. Press <span class='key-cap'>a</span> to enter Insert mode after the cursor, type the word <strong>'modes'</strong>, then press <span class='key-cap'>Esc</span> to return to Normal mode to complete the challenge.",
        text: "Vim has multiple ",
        targetText: "Vim has multiple modes",
        start: { line: 0, col: 16 }, // on the trailing space, the last character on the line
        type: "edit",
        requiredReps: 3,
        variants: [
          { text: "Learning takes ", targetText: "Learning takes practice", start: { line: 0, col: 14 } },
          { text: "Vim saves so much ", targetText: "Vim saves so much time", start: { line: 0, col: 17 } }
        ],
        hint: "Press 'a', type 'modes', then press 'Escape'.",
        splitTip: "Split Keyboard Tip: Map Esc to a thumb key or Caps Lock so your left pinky doesn't have to reach to the far top-left corner!"
      },
      {
        subtopic: "h, j, k, l",
        instructions: "Use home row navigation <span class='key-cap'>h</span> (left), <span class='key-cap'>j</span> (down), <span class='key-cap'>k</span> (up), and <span class='key-cap'>l</span> (right) to reach the target character <strong>'*'</strong>.",
        text: "const speed = 100;\n// move down here\n//    * target is here\nconst latency = 15;",
        start: { line: 0, col: 0 },
        target: { line: 2, col: 6 },
        type: "navigate",
        hint: "Press 'j' twice, then 'l' 6 times.",
        splitTip: "Split Keyboard Tip: Keep your hand centered. Your right index, middle, and ring fingers sit naturally on 'j', 'k', 'l'."
      },
      {
        subtopic: "w, e, b",
        instructions: "Use word jumps <span class='key-cap'>w</span> (start of next word), <span class='key-cap'>e</span> (end of word), and <span class='key-cap'>b</span> (back word) to jump quickly to the word <strong>'finish'</strong>.",
        text: "start -> jump -> hop -> skip -> finish -> end;",
        start: { line: 0, col: 0 },
        target: { line: 0, col: 32 }, // 'f' in finish
        type: "navigate",
        hint: "Press 'w' repeatedly to jump word-by-word. It's much faster than character-by-character 'l'.",
        splitTip: "Split Keyboard Tip: Word jumps help balance typing load across left and right hands."
      },
      {
        subtopic: "i, a, esc",
        instructions: "Enter Insert mode. Use <span class='key-cap'>i</span> (insert before cursor) or <span class='key-cap'>a</span> (append after cursor) to turn the text into <strong>'learn vim'</strong>, then exit with <span class='key-cap'>Esc</span>.",
        text: "lean vi",
        targetText: "learn vim",
        start: { line: 0, col: 3 }, // on 'n'
        type: "edit",
        requiredReps: 3,
        variants: [
          { text: "tets ru", targetText: "tests run", start: { line: 0, col: 2 } }, // on 2nd 't'
          { text: "wam da", targetText: "warm day", start: { line: 0, col: 2 } } // on 'm'
        ],
        hint: "The cursor already sits on 'n' — press 'i' right here to insert 'r' before it. Then press '$' to reach the end and 'a' to append 'm'. Remember to hit Esc after each edit.",
        splitTip: "Split Keyboard Tip: Esc is a highly frequent key. Try setting up a dual-role key (tapping Caps Lock acts as Esc, holding acts as Ctrl)."
      }
    ]
  },
  {
    id: "insert-pro",
    name: "2. Insert Like a Pro",
    description: "Learn advanced insertion points and short edit operators.",
    challenges: [
      {
        subtopic: "I, A, esc",
        instructions: "Use <span class='key-cap'>I</span> to insert text at the very beginning of the line, or <span class='key-cap'>A</span> to append at the very end. Turn the code line into a comment: <strong>'// export default App;'</strong>.",
        text: "export default App;",
        targetText: "// export default App;",
        start: { line: 0, col: 8 },
        type: "edit",
        hint: "Press 'I' to jump to start and enter insert mode. Type '// ' and press Esc.",
        splitTip: "Split Keyboard Tip: 'I' is Shift + 'i'. Keep wrists straight and use your left pinky for Shift and right middle for 'i'."
      },
      {
        subtopic: "o, O",
        instructions: "Use <span class='key-cap'>o</span> to insert a new line below, or <span class='key-cap'>O</span> to insert a line above. Create a line containing <strong>'const b = 2;'</strong> between lines 'a' and 'c'.",
        text: "const a = 1;\nconst c = 3;",
        targetText: "const a = 1;\nconst b = 2;\nconst c = 3;",
        start: { line: 0, col: 0 },
        type: "edit",
        hint: "With cursor on line 1, press 'o' to open a line below. Type 'const b = 2;' and press Escape.",
        splitTip: "Split Keyboard Tip: 'o' is right ring finger, top row. Let thumbs handle modifiers so fingers stay on home positions."
      },
      {
        subtopic: "s, x, r",
        instructions: "Use small edit commands: <span class='key-cap'>s</span> (substitute char: delete and insert), <span class='key-cap'>x</span> (delete character), and <span class='key-cap'>r</span> (replace character) to correct <strong>'lett flag = falsy;'</strong> to <strong>'let flag = false;'</strong>.",
        text: "lett flag = falsy;",
        targetText: "let flag = false;",
        start: { line: 0, col: 3 }, // on 't' of lett
        type: "edit",
        hint: "Press 'x' to delete extra 't'. Move to 'y' at end, press 's' (substitute), type 'e', and press Escape.",
        splitTip: "Split Keyboard Tip: 's', 'x', and 'r' allow editing without moving your hands to Backspace or Arrow keys!"
      }
    ]
  },
  {
    id: "essential-motions",
    name: "3. Essential Motions",
    description: "Master WORDS (whitespace-separated), line boundaries, and inline character targeting.",
    challenges: [
      {
        subtopic: "W, E, B",
        instructions: "Uppercase <span class='key-cap'>W</span>, <span class='key-cap'>E</span>, <span class='key-cap'>B</span> treat punctuation as part of the word (whitespace-separated). Navigate to the start of <strong>'config'</strong> in the text below.",
        text: "const path = api.v1.users.config[0];",
        start: { line: 0, col: 0 },
        target: { line: 0, col: 26 }, // 'c' in config
        type: "navigate",
        hint: "Typing 'w' stops on punctuation. Try uppercase 'W' to jump directly over dots and brackets.",
        splitTip: "Split Keyboard Tip: Shift + W is a common combo. Ensure your home row mods or shift keys are comfortable."
      },
      {
        subtopic: "0, _, $",
        instructions: "Use line boundary motions: <span class='key-cap'>0</span> (column 0), <span class='key-cap'>_</span> (first non-whitespace character), and <span class='key-cap'>$</span> (end of line) to land on the first non-blank character <strong>'r'</strong>.",
        text: "    return data.value;",
        start: { line: 0, col: 17 }, // ';'
        target: { line: 0, col: 4 },  // 'r'
        type: "navigate",
        hint: "Press '_' to jump directly to the first non-whitespace character. Pressing '0' would go to the leading space instead.",
        splitTip: "Split Keyboard Tip: '_' is on the symbol layer on split keyboards. Make sure your custom layout has it near the home row."
      },
      {
        subtopic: "f, F, ;",
        instructions: "Use <span class='key-cap'>f</span> followed by a character to search forward, or <span class='key-cap'>F</span> to search backward. Press <span class='key-cap'>;</span> (semicolon) to repeat the search to the letter <strong>'o'</strong> in <strong>'options'</strong>.",
        text: "const options = { port: 80, host: 'localhost' };",
        start: { line: 0, col: 47 }, // ';'
        target: { line: 0, col: 6 },  // 'o' in options
        type: "navigate",
        hint: "Press 'Fo' to search backward for 'o', then ';' repeatedly until you reach the start of options.",
        splitTip: "Split Keyboard Tip: Character find is the single fastest way to travel horizontally on a line!"
      },
      {
        subtopic: "t, T, ;",
        instructions: "Use <span class='key-cap'>t</span> (till character) to jump right before a char, or <span class='key-cap'>T</span> to jump right after a char backward. Land on <strong>'1'</strong>, right before the closing parenthesis.",
        text: "let result = computeScore(item, 1);",
        start: { line: 0, col: 0 },
        target: { line: 0, col: 32 }, // '1'
        type: "navigate",
        hint: "Press 't)' to place the cursor on '1', immediately before the parenthesis.",
        splitTip: "Split Keyboard Tip: Till 't' is excellent for editing up to a delimiter."
      }
    ]
  },
  {
    id: "basic-operators",
    name: "4. Basic Operators",
    description: "Combine operators (delete, change, yank) with motions for editing power.",
    challenges: [
      {
        subtopic: "operators",
        instructions: "Vim commands follow the structure: <strong>Operator + Motion</strong>. To practice, enter insert mode, type <strong>'operators'</strong> at the end of the line, and return to Normal mode.",
        text: "Vim is built on ",
        targetText: "Vim is built on operators",
        start: { line: 0, col: 15 },
        type: "edit",
        hint: "Press 'A' to append at the end, type 'operators', and press Esc.",
        splitTip: "Split Keyboard Tip: Grammar of Vim allows infinite combinations once you learn the operators."
      },
      {
        subtopic: "d, w",
        instructions: "Use <span class='key-cap'>d</span> followed by word motion <span class='key-cap'>w</span> to delete the extra word <strong>'bad'</strong>.",
        text: "const result = bad calculate();",
        targetText: "const result = calculate();",
        start: { line: 0, col: 15 }, // 'b' in bad
        type: "edit",
        hint: "Place cursor on 'b' of 'bad' and type 'dw'.",
        splitTip: "Split Keyboard Tip: 'd' and 'w' are split across left-hand fingers, creating a natural alternate typing flow."
      },
      {
        subtopic: "c, w",
        instructions: "Use <span class='key-cap'>c</span> (change operator) followed by word motion <span class='key-cap'>w</span> to change <strong>'slow'</strong> to <strong>'fast'</strong> in a single action.",
        text: "const mode = \"slow\";",
        targetText: "const mode = \"fast\";",
        start: { line: 0, col: 14 }, // 's' in slow
        type: "edit",
        hint: "Type 'cw' on 'slow', type 'fast', then press Escape.",
        splitTip: "Split Keyboard Tip: 'cw' deletes the word and enters Insert mode, saving you from typing 'dw' and 'i' separately."
      },
      {
        subtopic: "d, d, D",
        instructions: "Use <span class='key-cap'>d</span><span class='key-cap'>d</span> to delete a full line, or uppercase <span class='key-cap'>D</span> to delete from cursor to end of line. Remove the second line completely, and clear the tail comments on line 1.",
        text: "const x = 10; // extra comment here\nconst remove_me = true;",
        targetText: "const x = 10;",
        start: { line: 0, col: 13 }, // on '/'
        type: "edit",
        hint: "Type 'D' to delete from cursor to end of line. Then type 'j' and 'dd' to remove the second line.",
        splitTip: "Split Keyboard Tip: 'D' is Shift + D, 'dd' is a double tap. Very fast to type without movement."
      },
      {
        subtopic: "d, j, k",
        instructions: "You can delete multiple lines by combining <span class='key-cap'>d</span> with vertical motions. Delete the current line and the line below using <span class='key-cap'>d</span><span class='key-cap'>j</span>.",
        text: "const keep = true;\nconst delete_1 = 1;\nconst delete_2 = 2;",
        targetText: "const keep = true;",
        start: { line: 1, col: 0 }, // on delete_1 line
        type: "edit",
        hint: "With cursor on line 2, press 'dj' to delete the current and the next line.",
        splitTip: "Split Keyboard Tip: 'dj' uses left middle finger 'd' and right index finger 'j' - a balanced two-hand strike."
      },
      {
        subtopic: "y, p, P",
        instructions: "Use <span class='key-cap'>y</span><span class='key-cap'>y</span> to copy (yank) the current line, and <span class='key-cap'>p</span> to paste it below, or <span class='key-cap'>P</span> to paste above. Duplicate the variable declaration line.",
        text: "const item = 1;",
        targetText: "const item = 1;\nconst item = 1;",
        start: { line: 0, col: 0 },
        type: "edit",
        hint: "Press 'yy' to copy the line, then 'p' to paste it below.",
        splitTip: "Split Keyboard Tip: Copy-paste in Vim is instant and doesn't require selecting text with the mouse."
      }
    ]
  },
  {
    id: "advanced-vertical",
    name: "5. Advanced Vertical Movement",
    description: "Learn vertical line counts, top/bottom file boundaries, and paragraph jumps.",
    challenges: [
      {
        subtopic: "{n}, j, k",
        instructions: "Prepend a count number `{n}` to a motion to repeat it. Use relative line numbers to see that the target is 3 lines down. Jump directly to it using <span class='key-cap'>3</span><span class='key-cap'>j</span>.",
        text: "let a = 1;\nlet b = 2;\nlet c = 3;\nlet target = 4;",
        start: { line: 0, col: 0 },
        target: { line: 3, col: 4 }, // 't' in target
        type: "navigate",
        hint: "Type '3j' to jump down 3 lines, then 'w' to reach the target.",
        splitTip: "Split Keyboard Tip: Relative line numbers tell you exactly what count multiplier to type!"
      },
      {
        subtopic: "g, g, G",
        instructions: "Use absolute file jumps: <span class='key-cap'>g</span><span class='key-cap'>g</span> (top of file) and <span class='key-cap'>G</span> (bottom of file) to navigate to the word <strong>'last'</strong> at the bottom of the buffer.",
        text: "first line;\nline two;\nline three;\nline four;\nlast line;",
        start: { line: 0, col: 0 },
        target: { line: 4, col: 0 }, // 'l' in last
        type: "navigate",
        hint: "Press 'G' to jump to the last line instantly.",
        splitTip: "Split Keyboard Tip: 'gg' and 'G' let you fly through large files without scrolling."
      },
      {
        subtopic: "}, {",
        instructions: "Use <span class='key-cap'>}</span> to jump to the next empty line (paragraph end) and <span class='key-cap'>{</span> to jump to the previous empty line. Move quickly to the function <strong>'target'</strong>.",
        text: "function one() {\n}\n\nfunction two() {\n}\n\nfunction target() {\n}",
        start: { line: 0, col: 0 },
        target: { line: 6, col: 9 }, // 't' in target
        type: "navigate",
        hint: "Press '}' twice to skip empty lines, landing near 'target()', then 'w' to align.",
        splitTip: "Split Keyboard Tip: Paragraph jumps are extremely useful for skimming code functions."
      },
      {
        subtopic: "Ctrl+u, Ctrl+d",
        instructions: "Use window scrolls: <span class='key-cap'>Ctrl+d</span> (scroll down half screen) and <span class='key-cap'>Ctrl+u</span> (scroll up half screen) to reach the target <strong>'latency'</strong> below.",
        text: "let a = 1;\nlet b = 2;\nlet c = 3;\nlet d = 4;\nlet e = 5;\nlet f = 6;\nlet latency = 20;\nlet h = 8;",
        start: { line: 0, col: 0 },
        target: { line: 6, col: 4 }, // 'l' in latency
        type: "navigate",
        hint: "Press 'Ctrl + d' to scroll down quickly, then move left/right to reach the target.",
        splitTip: "Split Keyboard Tip: Hold Ctrl with your left thumb or home row mod, and tap 'd' or 'u' for effortless scrolling."
      }
    ]
  },
  {
    id: "search",
    name: "6. Search",
    description: "Search text using patterns, repeat queries, and quickly search words under the cursor.",
    challenges: [
      {
        subtopic: "/",
        instructions: "Press <span class='key-cap'>/</span> followed by a query and <span class='key-cap'>Enter</span> to search forward. Search for <strong>'target'</strong> to jump the cursor directly to it.",
        text: "const val = 100;\nconst score = val;\nconst target_val = 50;",
        start: { line: 0, col: 0 },
        target: { line: 2, col: 6 }, // 't' in target_val
        type: "navigate",
        hint: "Press '/target' and hit Enter.",
        splitTip: "Split Keyboard Tip: '/' is usually located on the right-hand pinky finger, easily reachable."
      },
      {
        subtopic: "n, N",
        instructions: "Use <span class='key-cap'>n</span> to repeat the last search in the same direction, or <span class='key-cap'>N</span> to repeat in the opposite direction. Find the third occurrence of the word <strong>'check'</strong>.",
        text: "let check = 1;\nlet skip = 2;\nlet check = 3;\nlet skip_again = 4;\nlet check = 5;",
        start: { line: 0, col: 0 },
        target: { line: 4, col: 4 }, // third 'check'
        type: "navigate",
        hint: "Search for check with '/check' + Enter, then tap 'n' twice to jump to subsequent matches.",
        splitTip: "Split Keyboard Tip: Tap 'n' (right index finger) to repeat searches without resetting hand posture."
      },
      {
        subtopic: "*, #",
        instructions: "Use <span class='key-cap'>*</span> to search forward for the word currently under the cursor, or <span class='key-cap'>#</span> to search backward. Search for another instance of <strong>'active'</strong>.",
        text: "let active = true;\nlet disabled = false;\nlet active = false;",
        start: { line: 0, col: 4 }, // on 'active'
        target: { line: 2, col: 4 }, // 'active' on line 3
        type: "navigate",
        hint: "With cursor on 'active', press '*' to jump to the next matching word.",
        splitTip: "Split Keyboard Tip: '*' is Shift + 8. Home row modifiers make this combination strain-free."
      },
      {
        subtopic: "Review",
        instructions: "Search Review: Find the word <strong>'secret'</strong> using backward search <span class='key-cap'>?</span>, then modify it to <strong>'public'</strong> using <span class='key-cap'>c</span><span class='key-cap'>w</span>.",
        text: "let type = \"secret\";\n// middle line\nlet view = \"normal\";",
        targetText: "let type = \"public\";\n// middle line\nlet view = \"normal\";",
        start: { line: 2, col: 15 },
        type: "edit",
        requiredReps: 1, // Compound review challenge — one careful rep is enough
        hint: "Type '?secret' and press Enter to search backward. Press 'cw', type 'public', and hit Esc.",
        splitTip: "Split Keyboard Tip: Combines search, operators, and insert mode. Practice returning to Normal mode with Esc!"
      }
    ]
  },
  {
    id: "text-objects-brackets",
    name: "7. Text Objects – Bracket Pairs",
    description: "Manipulate text inside braces, parentheses, and brackets. Essential for code structure.",
    challenges: [
      {
        subtopic: "text objects",
        instructions: "Text objects allow editing inside structure boundaries. To complete the intro, enter insert mode, type <strong>'text objects'</strong> at the end of the line, and return to Normal mode.",
        text: "Vim masters use ",
        targetText: "Vim masters use text objects",
        start: { line: 0, col: 15 }, // on the trailing space, the last character on the line
        type: "edit",
        hint: "Press 'A', type 'text objects', then press Escape.",
        splitTip: "Split Keyboard Tip: Text objects are Vim's most famous feature, and keep you from manual deletion."
      },
      {
        subtopic: "d, i, {",
        instructions: "Use <span class='key-cap'>d</span><span class='key-cap'>i</span><span class='key-cap'>{</span> to delete everything inside the curly braces (inner), leaving the braces empty.",
        text: "function run() { console.log('hello'); }",
        targetText: "function run() {}",
        start: { line: 0, col: 20 }, // inside braces
        type: "edit",
        hint: "Position cursor inside curly braces and press 'di{'.",
        splitTip: "Split Keyboard Tip: '{' is typically on a symbol layer. Keep it close to your home keys."
      },
      {
        subtopic: "d, a, {",
        instructions: "Use <span class='key-cap'>d</span><span class='key-cap'>a</span><span class='key-cap'>{</span> to delete *around* curly braces, removing the braces as well.",
        text: "const config = { port: 80 };",
        targetText: "const config = ;",
        start: { line: 0, col: 20 },
        type: "edit",
        hint: "Type 'da{' to remove the braces and everything inside them.",
        splitTip: "Split Keyboard Tip: 'da{' deletes the block and the braces, leaving the variable ready for reassignment."
      },
      {
        subtopic: "c, i, {",
        instructions: "Use <span class='key-cap'>c</span><span class='key-cap'>i</span><span class='key-cap'>(</span> (change inside parenthesis) to modify the function arguments to <strong>'x, y'</strong>.",
        text: "calculate(width, height);",
        targetText: "calculate(x, y);",
        start: { line: 0, col: 14 },
        type: "edit",
        hint: "Position cursor inside parentheses, press 'ci(', type 'x, y', and press Esc.",
        splitTip: "Split Keyboard Tip: 'ci(' is a quick left-right hand roll that accelerates argument editing."
      },
      {
        subtopic: "c, a, {",
        instructions: "Use <span class='key-cap'>c</span><span class='key-cap'>a</span><span class='key-cap'>[</span> to change around brackets. Replace the array including its brackets with the word <strong>'null'</strong>.",
        text: "const data = [1, 2, 3];",
        targetText: "const data = null;",
        start: { line: 0, col: 15 },
        type: "edit",
        hint: "Position cursor inside brackets, press 'ca[', type 'null', and press Esc.",
        splitTip: "Split Keyboard Tip: Around modifiers include brackets. Useful for changing data structures."
      },
      {
        subtopic: "Brackets Review",
        instructions: "Brackets Review: Delete all items inside the function call parenthesis using <span class='key-cap'>d</span><span class='key-cap'>i</span><span class='key-cap'>)</span>.",
        text: "dispatch(updateUserStatus(user.id, 'active'));",
        targetText: "dispatch();",
        start: { line: 0, col: 25 }, // inside the outer parenthesis
        type: "edit",
        requiredReps: 1, // Compound review challenge — one careful rep is enough
        hint: "Position cursor on 'updateUserStatus' inside the outer parenthesis, and press 'di)'.",
        splitTip: "Split Keyboard Tip: Vim parses matching bracket nesting automatically, so you don't have to count characters."
      }
    ]
  },
  {
    id: "text-objects-quotes",
    name: "8. Text Objects – Quotes",
    description: "Modify string values inside single and double quotes quickly.",
    challenges: [
      {
        subtopic: "d, i, \"",
        instructions: "Use <span class='key-cap'>d</span><span class='key-cap'>i</span><span class='key-cap'>\"</span> to delete everything inside double quotes, leaving empty quotes.",
        text: "const title = \"Welcome to the dashboard\";",
        targetText: "const title = \"\";",
        start: { line: 0, col: 18 },
        type: "edit",
        hint: "With cursor inside the string, type 'di\"'.",
        splitTip: "Split Keyboard Tip: Quotes are a frequent target. Keep your wrist straight while pressing the quote key."
      },
      {
        subtopic: "d, a, \"",
        instructions: "Use <span class='key-cap'>d</span><span class='key-cap'>a</span><span class='key-cap'>\"</span> to delete *around* double quotes, removing the quotes themselves.",
        text: "const label = \"Remove Me\";",
        targetText: "const label = ;",
        start: { line: 0, col: 16 },
        type: "edit",
        hint: "Type 'da\"' inside the quotes to delete the quotes and string contents.",
        splitTip: "Split Keyboard Tip: 'da\"' leaves the space clear for a variable or function call."
      },
      {
        subtopic: "c, i, \"",
        instructions: "Use <span class='key-cap'>c</span><span class='key-cap'>i</span><span class='key-cap'>'</span> to change inside single quotes. Replace the content with <strong>'production'</strong>.",
        text: "const env = 'development';",
        targetText: "const env = 'production';",
        start: { line: 0, col: 15 },
        type: "edit",
        hint: "With cursor inside the single quotes, type 'ci'', type 'production', and press Esc.",
        splitTip: "Split Keyboard Tip: Single quote 'ci'' works exactly like double quotes."
      },
      {
        subtopic: "c, a, \"",
        instructions: "Use <span class='key-cap'>c</span><span class='key-cap'>a</span><span class='key-cap'>'</span> to replace single quotes and their content with the number <strong>'5000'</strong>.",
        text: "const port = '8080';",
        targetText: "const port = 5000;",
        start: { line: 0, col: 15 },
        type: "edit",
        hint: "Type 'ca'', type '5000', and press Esc.",
        splitTip: "Split Keyboard Tip: Eliminates quotes and enters insert mode. A massive keystroke saver."
      },
      {
        subtopic: "Quotes Review",
        instructions: "Quotes Review: Change the value inside the double quotes to <strong>'Vim'</strong> using <span class='key-cap'>c</span><span class='key-cap'>i</span><span class='key-cap'>\"</span>.",
        text: "const name = \"Emacs\";",
        targetText: "const name = \"Vim\";",
        start: { line: 0, col: 15 },
        type: "edit",
        requiredReps: 1, // Compound review challenge — one careful rep is enough
        hint: "Type 'ci\"', type 'Vim', and press Esc.",
        splitTip: "Split Keyboard Tip: Keep practicing Esc key rolls to build fluid muscle memory."
      }
    ]
  },
  {
    id: "text-objects-words",
    name: "9. Text Objects – Words",
    description: "Learn inner word and around word editing targets.",
    challenges: [
      {
        subtopic: "d, i, w",
        instructions: "Use <span class='key-cap'>d</span><span class='key-cap'>i</span><span class='key-cap'>w</span> to delete the word under the cursor (inner word), preserving surrounding spaces.",
        text: "const score = initial value;",
        targetText: "const score = value;",
        start: { line: 0, col: 16 }, // 'i' in initial
        type: "edit",
        hint: "Type 'diw' on the word 'initial' to delete it.",
        splitTip: "Split Keyboard Tip: 'diw' is safer than 'dw' because it can be typed anywhere inside the word, not just at the start."
      },
      {
        subtopic: "d, a, w",
        instructions: "Use <span class='key-cap'>d</span><span class='key-cap'>a</span><span class='key-cap'>w</span> to delete the word under the cursor AND its surrounding whitespace (around word).",
        text: "const val = active   flag;",
        targetText: "const val = flag;",
        start: { line: 0, col: 14 }, // on active
        type: "edit",
        hint: "Type 'daw' on the word 'active' to remove it and its spacing.",
        splitTip: "Split Keyboard Tip: 'daw' deletes the word plus one whitespace character, cleaning up sentence spaces."
      },
      {
        subtopic: "c, i, w",
        instructions: "Use <span class='key-cap'>c</span><span class='key-cap'>i</span><span class='key-cap'>w</span> to change the word under the cursor. Replace <strong>'prevUser'</strong> with <strong>'currentUser'</strong>.",
        text: "const user = prevUser;",
        targetText: "const user = currentUser;",
        start: { line: 0, col: 15 }, // on prevUser
        type: "edit",
        hint: "Press 'ciw', type 'currentUser', and press Esc.",
        splitTip: "Split Keyboard Tip: 'ciw' is the single most frequent editing operation in programming."
      },
      {
        subtopic: "Words Review",
        instructions: "Words Review: Position the cursor on the word <strong>'remove'</strong> and delete it completely along with its spaces using <span class='key-cap'>d</span><span class='key-cap'>a</span><span class='key-cap'>w</span>.",
        text: "let list = [items, remove, values];",
        targetText: "let list = [items, values];",
        start: { line: 0, col: 20 },
        type: "edit",
        requiredReps: 1, // Compound review challenge — one careful rep is enough
        hint: "Position cursor on 'remove' and press 'daw'. Notice how it deletes the trailing comma space.",
        splitTip: "Split Keyboard Tip: 'daw' understands code spacing, keeping variables neat."
      }
    ]
  },
  {
    id: "text-objects-paragraphs",
    name: "10. Text Objects – Paragraphs",
    description: "Delete and modify full paragraphs (code blocks separated by empty lines).",
    challenges: [
      {
        subtopic: "d, i, p",
        instructions: "Use <span class='key-cap'>d</span><span class='key-cap'>i</span><span class='key-cap'>p</span> to delete the lines *inside* the current paragraph block, leaving the surrounding empty lines.",
        text: "const head = 1;\n\nconsole.log('block');\nconsole.log('extra');\n\nconst tail = 2;",
        targetText: "const head = 1;\n\n\nconst tail = 2;",
        start: { line: 2, col: 0 },
        type: "edit",
        hint: "With cursor on 'console.log', type 'dip' to delete the block.",
        splitTip: "Split Keyboard Tip: 'dip' stands for 'delete inner paragraph'. High efficiency for block refactoring."
      },
      {
        subtopic: "d, a, p",
        instructions: "Use <span class='key-cap'>d</span><span class='key-cap'>a</span><span class='key-cap'>p</span> to delete the current paragraph block AND its following blank line.",
        text: "const head = 1;\n\nconsole.log('block');\n\nconst tail = 2;",
        targetText: "const head = 1;\n\nconst tail = 2;",
        start: { line: 2, col: 0 },
        type: "edit",
        hint: "Type 'dap' to remove the block and collapse the empty spacing.",
        splitTip: "Split Keyboard Tip: 'dap' cleans up empty spaces between sections."
      },
      {
        subtopic: "c, i, p",
        instructions: "Use <span class='key-cap'>c</span><span class='key-cap'>i</span><span class='key-cap'>p</span> to change inside the paragraph block. Replace the function body with <strong>'return false;'</strong>.",
        text: "function active() {\n  const x = 1;\n  return true;\n}",
        targetText: "return false;",
        start: { line: 1, col: 2 },
        type: "edit",
        hint: "Position cursor on line 2, press 'cip', type 'return false;', and press Esc.",
        splitTip: "Split Keyboard Tip: Useful for clearing a function body or variable block."
      },
      {
        subtopic: "Paragraphs Review",
        instructions: "Paragraphs Review: Use <span class='key-cap'>d</span><span class='key-cap'>i</span><span class='key-cap'>p</span> to delete the intermediate block.",
        text: "let start = true;\n\n// delete me\n// and me\n\nlet end = false;",
        targetText: "let start = true;\n\n\nlet end = false;",
        start: { line: 2, col: 0 },
        type: "edit",
        requiredReps: 1, // Compound review challenge — one careful rep is enough
        hint: "Press 'dip' anywhere inside the commented paragraph.",
        splitTip: "Split Keyboard Tip: Enforces vertical editing speed without line-by-line highlights."
      }
    ]
  },
  {
    id: "text-objects-mega-review",
    name: "11. Text Objects Mega Review",
    description: "Combine words, brackets, quotes, and paragraph objects in a single review.",
    challenges: [
      {
        subtopic: "Mega Review",
        instructions: "Mega Review: Change the string inside single quotes to <strong>'success'</strong> using <span class='key-cap'>c</span><span class='key-cap'>i</span><span class='key-cap'>'</span>. Then delete the brackets using <span class='key-cap'>d</span><span class='key-cap'>a</span><span class='key-cap'>[</span>.",
        text: "const status = ['error'];",
        targetText: "const status = ;",
        start: { line: 0, col: 17 }, // inside quotes
        type: "edit",
        requiredReps: 1, // Compound review challenge — one careful rep is enough
        hint: "Press 'ci'' to change to 'success'. Press Esc, then type 'da['.",
        splitTip: "Split Keyboard Tip: Flowing between 'ci'' and 'da[' develops professional muscle memory."
      }
    ]
  },
  {
    id: "visual-mode",
    name: "12. Visual Mode",
    description: "Select, highlight, and operate on text blocks interactively.",
    challenges: [
      {
        subtopic: "v, esc",
        instructions: "Press <span class='key-cap'>v</span> to enter Visual Mode, move cursor to highlight text, and press <span class='key-cap'>Esc</span> to exit back to Normal mode to complete this challenge.",
        text: "Select some characters here",
        targetText: "Select some characters here", // text doesn't change, just test v + esc
        start: { line: 0, col: 0 },
        type: "edit",
        hint: "Press 'v', move with 'l', then press Escape.",
        splitTip: "Split Keyboard Tip: Visual mode gives you real-time feedback on your selection range."
      },
      {
        subtopic: "d, c, y",
        instructions: "Use character Visual mode <span class='key-cap'>v</span> followed by movement and operator <span class='key-cap'>d</span> to delete the selection <strong>'temp_data'</strong>.",
        text: "let result = temp_data + active_val;",
        targetText: "let result =  + active_val;",
        start: { line: 0, col: 13 }, // start of temp_data
        type: "edit",
        hint: "Press 'v', jump with 'e' or 'l' to highlight 'temp_data', then press 'd'.",
        splitTip: "Split Keyboard Tip: In Visual mode, 'd', 'c', 'y' act immediately on the selection."
      },
      {
        subtopic: "v, o",
        instructions: "Use <span class='key-cap'>o</span> inside Visual Mode to switch the cursor to the other end of your selection. Extend the start of the selection to include the word <strong>'const'</strong> and change it all using <span class='key-cap'>c</span> to <strong>'let x = 10;'</strong>.",
        text: "const x = 50;",
        targetText: "let x = 10;",
        start: { line: 0, col: 6 }, // on x
        type: "edit",
        hint: "Press 'v', press 'e' to select to end. Press 'o' to move cursor to start of selection, press 'b' or 'h' to select 'const'. Press 'c', type 'let x = 10;', and press Esc.",
        splitTip: "Split Keyboard Tip: 'o' is crucial for adjusting selections when you start highlight at the wrong end!"
      },
      {
        subtopic: "V, esc",
        instructions: "Use Visual Line mode <span class='key-cap'>V</span> (Shift + v) to select entire lines. Exit visual line mode with <span class='key-cap'>Esc</span>.",
        text: "Select full lines\nLine two selection",
        targetText: "Select full lines\nLine two selection",
        start: { line: 0, col: 0 },
        type: "edit",
        hint: "Press 'V', select line 2 with 'j', then press Escape.",
        splitTip: "Split Keyboard Tip: Visual line mode selects the entire line layout automatically."
      },
      {
        subtopic: "V, o",
        instructions: "Use Visual Line mode <span class='key-cap'>V</span>, move lines, and press <span class='key-cap'>o</span> to swap cursor ends. Land cursor at the top of the selection.",
        text: "Line 1\nLine 2\nLine 3",
        targetText: "Line 1\nLine 2\nLine 3",
        start: { line: 0, col: 0 },
        type: "edit",
        hint: "Press 'V', 'j', 'j' to select all lines. Press 'o' to move cursor back to Line 1. Press Esc.",
        splitTip: "Split Keyboard Tip: Useful for confirming selection boundaries before massive edits."
      },
      {
        subtopic: "V, d, y",
        instructions: "Use Visual Line mode <span class='key-cap'>V</span> to select the lower two lines and delete them using <span class='key-cap'>d</span>.",
        text: "const keep = true;\nconst remove_1 = 1;\nconst remove_2 = 2;",
        targetText: "const keep = true;",
        start: { line: 1, col: 0 },
        type: "edit",
        hint: "Press 'V', 'j' to select both lines, then press 'd'.",
        splitTip: "Split Keyboard Tip: Fast deletion of arbitrary code blocks."
      }
    ]
  }
];
