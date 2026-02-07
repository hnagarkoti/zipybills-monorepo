# 🚀 Quick Start - Barcode System

## Start Everything
```bash
cd /Users/hemantsinghnagarkoti/Documents/projects/zipybills
pnpm dev:barcode
```

## Access Apps
- **Web**: http://localhost:3001/scanner
- **Mobile**: Scan QR code in terminal or press `i` for iOS simulator

## Quick Test (30 seconds)

1. **Generate Barcode:**
   - Click "🎫 Generate Barcode"
   - Note the barcode (e.g., `BC17388760001234`)

2. **Process at Machine 2:**
   - Select "Machine 2"
   - Paste the barcode
   - Click "✅ Process Barcode"
   - See success with history!

3. **Try Demo Data:**
   - Enter: `DEMO_BARCODE_005`
   - Select "Machine 2"  
   - Click Process
   - Success! (Machine 1 already processed it)

4. **Test Error:**
   - Keep "Machine 2" selected
   - Enter same demo barcode again
   - See error: "Already processed"

## Demo Barcodes Ready to Use
- `DEMO_BARCODE_001` - All 4 machines ✅
- `DEMO_BARCODE_002` - Machines 1,2,3 ✅
- `DEMO_BARCODE_003` - Machines 1,2 ✅
- `DEMO_BARCODE_004` - Machines 1,2 ✅
- `DEMO_BARCODE_005` - Machine 1 only ✅

## Next: Test on Mobile
```bash
# iPhone Simulator
pnpm dev:barcode-ios

# Or scan QR code with Expo Go (SDK 54)
```

See [BARCODE_TESTING_GUIDE.md](./BARCODE_TESTING_GUIDE.md) for complete testing instructions.
