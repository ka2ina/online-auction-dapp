#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"


echo " ============================================== "


#1. Installa dipendenze

npm install
if [ ! -d "node_modules" ]; then
    echo "npm install fallito"
    exit 1
fi
echo "Dipendenze installate"
echo ""

#2. Compilazione contratto Solidity

npm run compile > compile_output.tmp 2>&1
cat compile_output.tmp
if grep -qi "SyntaxError\|CompileError\|ParseError\|HardhatError" compile_output.tmp; then
    rm -f compile_output.tmp
    echo "Compilazione fallita. Controlla il contratto Solidity"
    exit 1
fi
rm -f compile_output.tmp
echo "OK"
echo ""

#3. Esegui test + coverage

npm run coverage > test_output.tmp 2>&1
cat test_output.tmp
if grep -qi "failing" test_output.tmp; then
    rm -f test_output.tmp
    echo "Uno o più test sono falliti"
    exit 1
fi
rm -f test_output.tmp
echo "Test e coverage completati"
echo ""

#4. Avvia il nodo in background
echo " [4/5] Avvio nodo Hardhat locale..."
npm run node &
NODE_PID=$!
echo " Attendo che il nodo sia pronto..."
attempts=0
while true; do
    sleep 1
    if curl -s -X POST http://127.0.0.1:8545 \
        -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' > /dev/null 2>&1; then
        break
    fi
    attempts=$((attempts + 1))
    if [ "$attempts" -ge 15 ]; then
        echo " [ERRORE] Il nodo non risponde dopo 15 secondi."
        exit 1
    fi
done
echo " [OK] Nodo attivo su http://127.0.0.1:8545"
echo ""

#5. Deploy
echo " [5/5] Deploy del contratto..."
npm run deploy:local > deploy_output.tmp 2>&1
cat deploy_output.tmp
echo ""

if grep -qi "HardhatError\|Error:" deploy_output.tmp | grep -qiv "UV_HANDLE_CLOSING\|Assertion failed"; then
    rm -f deploy_output.tmp
    echo "Deploy fallito."
    exit 1
fi

DEPLOY_LINE=$(grep -i "deployato" deploy_output.tmp || true)
CONTRACT_ADDRESS=$(echo "$DEPLOY_LINE" | awk '{print $5}')
rm -f deploy_output.tmp

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo "Non riesco a leggere l'indirizzo del contratto."
    exit 1
fi
echo " [OK] Contratto deployato: $CONTRACT_ADDRESS"
echo ""

echo " Aggiornamento indirizzo in interact.js..."
node -e "
const fs = require('fs');
const f = 'scripts/interact.js';
let c = fs.readFileSync(f, 'utf8');
c = c.replace(/CONTRACT_ADDRESS\s*=\s*[\"'].*?[\"']/, 'CONTRACT_ADDRESS = \"$CONTRACT_ADDRESS\"');
fs.writeFileSync(f, c);
console.log('Indirizzo aggiornato: $CONTRACT_ADDRESS');
"
echo ""

#6. Interazione
echo " Avvio script di interazione"
echo " ========================================== "
echo ""
npm run interact > interact_output.tmp 2>&1
cat interact_output.tmp
echo ""

if grep -qi "HardhatError\|Error:" interact_output.tmp | grep -qiv "UV_HANDLE_CLOSING\|Assertion failed"; then
    rm -f interact_output.tmp
    echo "script di interazione fallito"
    exit 1
fi
rm -f interact_output.tmp



