from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from datetime import datetime
import os
import traceback
import math
from data_processor import ChillerDataProcessor
from ml_models import PredictiveMaintenanceModel, EnergyEfficiencyModel

app = Flask(__name__)

# Enable CORS
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

print("\n" + "="*70)
print("🚀 INITIALIZING CHILLER MONITORING BACKEND")
print("="*70)

# Initialize processor and models
processor = ChillerDataProcessor()
pm_model = PredictiveMaintenanceModel()
ee_model = EnergyEfficiencyModel()

# Load trained models
try:
    pm_model.load('models/predictive_maintenance.pkl')
    ee_model.load('models/energy_efficiency.pkl')
    print("✅ All models loaded successfully")
except Exception as e:
    print(f"⚠️ Warning: Could not load models - {e}")
    print("💡 Please train models first: python train_models.py your_data.csv")

# Store for real-time data
realtime_data = []
request_counter = {'static': 0, 'realtime': 0}

print("="*70 + "\n")


def sanitize_for_json(obj):
    """
    Recursively sanitize data structure for JSON serialization
    Replaces NaN, Infinity, and numpy types with JSON-compatible values
    """
    if obj is None:
        return None
    
    elif isinstance(obj, dict):
        return {key: sanitize_for_json(value) for key, value in obj.items()}
    
    elif isinstance(obj, (list, tuple)):
        return [sanitize_for_json(item) for item in obj]
    
    elif isinstance(obj, (np.integer, np.int64, np.int32, np.int16, np.int8)):
        return int(obj)
    
    elif isinstance(obj, (np.floating, np.float64, np.float32, np.float16)):
        if np.isnan(obj) or np.isinf(obj):
            return None
        return float(obj)
    
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    
    elif isinstance(obj, (np.bool_, bool)):
        return bool(obj)
    
    elif isinstance(obj, str):
        return obj
    
    elif isinstance(obj, (int,)):
        return obj
    
    else:
        # Try to convert to string as last resort
        try:
            return str(obj)
        except:
            return None


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    print("🏥 Health check requested")
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'models_loaded': pm_model.model is not None and ee_model.model is not None,
        'realtime_buffer_size': len(realtime_data),
        'requests_static': request_counter['static'],
        'requests_realtime': request_counter['realtime']
    })


@app.route('/upload', methods=['POST', 'OPTIONS'])
def upload_static_data():
    """Upload static CSV file for analysis"""
    
    if request.method == 'OPTIONS':
        print("📋 CORS preflight request")
        return '', 204
    
    request_counter['static'] += 1
    
    print("\n" + "="*70)
    print(f"📤 STATIC CSV UPLOAD REQUEST #{request_counter['static']}")
    print("="*70)
    
    try:
        # Step 1: Check request
        print("\n🔍 STEP 1: Checking request...")
        print(f"  - Request method: {request.method}")
        print(f"  - Content-Type: {request.content_type}")
        print(f"  - Files in request: {list(request.files.keys())}")
        print(f"  - Form in request: {list(request.form.keys())}")
        
        # Step 2: Validate file
        if 'file' not in request.files:
            print("❌ ERROR: No 'file' key in request")
            print(f"  Available keys: {list(request.files.keys())}")
            return jsonify({
                'error': 'No file provided',
                'debug': {
                    'files_keys': list(request.files.keys()),
                    'form_keys': list(request.form.keys())
                }
            }), 400
        
        file = request.files['file']
        
        if file.filename == '':
            print("❌ ERROR: Empty filename")
            return jsonify({'error': 'No file selected'}), 400
        
        print(f"✅ File received: {file.filename}")
        
        # Step 3: Read CSV
        print("\n📖 STEP 2: Reading CSV file...")
        df = pd.read_csv(file)
        print(f"✅ CSV loaded: {len(df)} rows × {len(df.columns)} columns")
        print(f"  - Column sample: {list(df.columns[:5])}...")
        
        # Step 4: Process data
        print("\n🔄 STEP 3: Processing data...")
        result = process_chiller_data(df, is_realtime=False)
        
        # Step 5: Sanitize data (remove NaN, Infinity)
        print("\n🧹 STEP 4: Sanitizing data for JSON...")
        sanitized_result = sanitize_for_json(result)
        print("✅ Data sanitized (NaN/Inf removed)")
        
        # Step 6: Validate result
        print("\n🔍 STEP 5: Validating result...")
        print(f"  - Type: {type(sanitized_result)}")
        print(f"  - Keys: {list(sanitized_result.keys())}")
        print(f"  - Summary keys: {list(sanitized_result['summary'].keys())}")
        
        # Step 7: Send response
        print("\n📤 STEP 6: Sending response to frontend...")
        print(f"  - Total records: {sanitized_result['summary']['total_records']}")
        print(f"  - Operational records: {sanitized_result['summary']['operational_records']}")
        print(f"  - Alerts generated: {len(sanitized_result['alerts'])}")
        print(f"  - Timeseries points: {len(sanitized_result['timeseries_data'])}")
        print(f"✅ Response prepared and sending...")
        
        print("="*70 + "\n")
        
        response = jsonify(sanitized_result)
        response.headers['Content-Type'] = 'application/json'
        return response, 200
    
    except Exception as e:
        print(f"\n❌ ERROR OCCURRED:")
        print(f"  - Error type: {type(e).__name__}")
        print(f"  - Error message: {str(e)}")
        print("\n📋 Traceback:")
        print(traceback.format_exc())
        print("="*70 + "\n")
        
        return jsonify({
            'error': str(e),
            'type': type(e).__name__,
            'traceback': traceback.format_exc()
        }), 500


@app.route('/realtime/data', methods=['POST', 'OPTIONS'])
def receive_realtime_data():
    """Receive real-time data point"""
    
    if request.method == 'OPTIONS':
        return '', 204
    
    request_counter['realtime'] += 1
    
    print("\n" + "="*70)
    print(f"📡 REAL-TIME DATA REQUEST #{request_counter['realtime']}")
    print("="*70)
    
    try:
        # Step 1: Receive data
        print("\n🔍 STEP 1: Receiving JSON data...")
        data = request.json
        
        if not data:
            print("❌ ERROR: Empty JSON data")
            return jsonify({'error': 'No data provided'}), 400
        
        print(f"✅ Data received with {len(data)} keys")
        print(f"  - Sample keys: {list(data.keys())[:5]}...")
        
        # Add timestamp
        if 'timestamp' not in data:
            data['timestamp'] = datetime.now().isoformat()
        
        # Step 2: Store data
        print("\n💾 STEP 2: Storing data in buffer...")
        realtime_data.append(data)
        
        if len(realtime_data) > 1000:
            realtime_data.pop(0)
        
        print(f"✅ Data stored. Buffer size: {len(realtime_data)}")
        
        # Step 3: Process data
        print("\n🔄 STEP 3: Processing data...")
        df = pd.DataFrame([data])
        result = process_chiller_data(df, is_realtime=True)
        
        # Step 4: Sanitize data
        print("\n🧹 STEP 4: Sanitizing data...")
        sanitized_result = sanitize_for_json(result)
        
        # Step 5: Send response
        print("\n📤 STEP 5: Sending response...")
        print(f"✅ Response sent (Operational mode: {sanitized_result['summary']['operational_records']} records)")
        print("="*70 + "\n")
        
        response = jsonify(sanitized_result)
        response.headers['Content-Type'] = 'application/json'
        return response, 200
    
    except Exception as e:
        print(f"\n❌ ERROR OCCURRED:")
        print(f"  - Error: {str(e)}")
        print(traceback.format_exc())
        print("="*70 + "\n")
        
        return jsonify({
            'error': str(e),
            'type': type(e).__name__
        }), 500


@app.route('/realtime/history', methods=['GET', 'OPTIONS'])
def get_realtime_history():
    """Get historical real-time data - FIXED VERSION"""
    
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        limit = request.args.get('limit', 100, type=int)
        
        # Get raw data points
        raw_data = realtime_data[-limit:] if len(realtime_data) > limit else realtime_data
        
        if not raw_data:
            return jsonify({'data': [], 'count': 0}), 200
        
        print(f"📤 Processing {len(raw_data)} realtime history points...")
        
        # ===== NEW: Process raw data into expected format =====
        processed_points = []
        
        for raw_point in raw_data:
            # Convert raw data point to DataFrame
            df = pd.DataFrame([raw_point])
            
            # Process it
            processed_df = processor.process_dataset(df)
            
            if len(processed_df) > 0:
                row = processed_df.iloc[0]
                
                # Format as expected by frontend
                point = {
                    'timestamp': str(row.get('timestamp', raw_point.get('timestamp', ''))),
                    'operational_mode': int(row['operational_mode']),
                    'comp1_current': float(row.get('Compressor 1 Current', 0) or 0),
                    'comp2_current': float(row.get('Compressor 2 Current', 0) or 0),
                    'discharge_pressure_1': float(row.get('Discharge Pressure 1', 0) or 0),
                    'discharge_pressure_2': float(row.get('Discharge Pressure 2', 0) or 0),
                    'suction_pressure_1': float(row.get('Suction Pressure 1', 0) or 0),
                    'suction_pressure_2': float(row.get('Suction Pressure 2', 0) or 0),
                    'water_in_temp': float(row.get('Cooler Water In Temp', 0) or 0),
                    'water_out_temp': float(row.get('Cooler Water Out Temp', 0) or 0),
                    'cop': float(row.get('cop', 0) or 0) if row.get('cop') is not None else 0,
                    'has_anomaly': bool(row.get('has_anomaly', False))
                }
                
                processed_points.append(point)
        # ===== END NEW =====
        
        # Sanitize for JSON
        sanitized_data = sanitize_for_json(processed_points)
        
        print(f"✅ Returning {len(sanitized_data)} processed points")
        
        return jsonify({
            'data': sanitized_data,
            'count': len(sanitized_data)
        }), 200
    
    except Exception as e:
        print(f"❌ Error in realtime history: {e}")
        import traceback
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@app.route('/realtime/clear', methods=['POST', 'OPTIONS'])
def clear_realtime_data():
    """Clear real-time data storage"""
    
    if request.method == 'OPTIONS':
        return '', 204
    
    global realtime_data
    old_count = len(realtime_data)
    realtime_data = []
    
    print(f"🗑️ Realtime data cleared ({old_count} records removed)")
    
    return jsonify({
        'message': 'Real-time data cleared',
        'records_cleared': old_count
    }), 200

# Add these debug endpoints to your app.py

@app.route('/debug/cop-analysis', methods=['POST'])
def debug_cop_analysis():
    """Detailed COP analysis for uploaded CSV"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        df = pd.read_csv(file)
        
        print("\n" + "="*70)
        print("🔍 DETAILED COP DEBUG ANALYSIS")
        print("="*70)
        
        # Process data
        processed_df = processor.process_dataset(df)
        
        # Analyze COP values
        cop_analysis = {
            'total_rows': len(processed_df),
            'operational_rows': len(processed_df[processed_df['operational_mode'] > 0]),
            'mode_0_rows': len(processed_df[processed_df['operational_mode'] == 0]),
            'mode_1_rows': len(processed_df[processed_df['operational_mode'] == 1]),
            'mode_2_rows': len(processed_df[processed_df['operational_mode'] == 2]),
            'cop_not_null': len(processed_df[processed_df['cop'].notna()]),
            'cop_is_null': len(processed_df[processed_df['cop'].isna()]),
            'cop_greater_than_zero': len(processed_df[processed_df['cop'] > 0]),
            'cop_equals_zero': len(processed_df[processed_df['cop'] == 0]),
            'sample_rows': []
        }
        
        # Get sample rows with different scenarios
        print("\n📊 Analyzing sample rows...")
        
        # Sample operational rows
        operational = processed_df[processed_df['operational_mode'] > 0]
        
        if len(operational) > 0:
            for idx in range(min(5, len(operational))):
                row = operational.iloc[idx]
                
                sample = {
                    'index': int(row.name),
                    'operational_mode': int(row['operational_mode']),
                    'cop': float(row['cop']) if pd.notna(row['cop']) else None,
                    'comp1_current': float(row.get('Compressor 1 Current', 0)),
                    'comp2_current': float(row.get('Compressor 2 Current', 0)),
                    'water_in_temp': float(row.get('Cooler Water In Temp', 0)),
                    'water_out_temp': float(row.get('Cooler Water Out Temp', 0)),
                    'delta_t': float(row.get('Cooler Water In Temp', 0) - row.get('Cooler Water Out Temp', 0)),
                }
                
                cop_analysis['sample_rows'].append(sample)
                
                print(f"\n  Row {sample['index']}:")
                print(f"    Mode: {sample['operational_mode']}")
                print(f"    COP: {sample['cop']}")
                print(f"    Comp1: {sample['comp1_current']}A, Comp2: {sample['comp2_current']}A")
                print(f"    Water In: {sample['water_in_temp']}°F, Out: {sample['water_out_temp']}°F")
                print(f"    Delta T: {sample['delta_t']}°F")
        
        # Check timeseries data format
        result = process_chiller_data(df, is_realtime=False)
        
        timeseries_cop = {
            'total_points': len(result['timeseries_data']),
            'points_with_cop': len([p for p in result['timeseries_data'] if p.get('cop', 0) > 0]),
            'points_without_cop': len([p for p in result['timeseries_data'] if p.get('cop', 0) == 0]),
            'sample_timeseries': result['timeseries_data'][:5] if len(result['timeseries_data']) > 0 else []
        }
        
        print("\n📈 Timeseries Data:")
        print(f"   Total points: {timeseries_cop['total_points']}")
        print(f"   Points with COP > 0: {timeseries_cop['points_with_cop']}")
        print(f"   Points with COP = 0: {timeseries_cop['points_without_cop']}")
        
        if timeseries_cop['sample_timeseries']:
            print("\n   First 3 timeseries points:")
            for i, point in enumerate(timeseries_cop['sample_timeseries'][:3]):
                print(f"     [{i}] COP: {point.get('cop')}, Mode: {point.get('operational_mode')}")
        
        print("="*70 + "\n")
        
        return jsonify({
            'cop_analysis': cop_analysis,
            'timeseries_analysis': timeseries_cop,
            'energy_efficiency': result.get('energy_efficiency', {}),
            'summary': result.get('summary', {})
        }), 200
        
    except Exception as e:
        print(f"\n❌ ERROR in debug_cop_analysis:")
        print(traceback.format_exc())
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500


@app.route('/debug/realtime-cop-check', methods=['GET'])
def debug_realtime_cop_check():
    """Check COP values in real-time buffer"""
    
    if len(realtime_data) == 0:
        return jsonify({
            'status': 'empty',
            'message': 'No real-time data in buffer'
        })
    
    cop_stats = {
        'buffer_size': len(realtime_data),
        'points_with_cop': len([p for p in realtime_data if p.get('cop', 0) > 0]),
        'points_without_cop': len([p for p in realtime_data if p.get('cop', 0) == 0]),
        'cop_values': [p.get('cop', 0) for p in realtime_data[-10:]],
        'sample_points': realtime_data[-5:]
    }
    
    print(f"\n📊 Real-time COP Check:")
    print(f"   Buffer: {cop_stats['buffer_size']} points")
    print(f"   With COP: {cop_stats['points_with_cop']}")
    print(f"   Without COP: {cop_stats['points_without_cop']}")
    print(f"   Last 5 COP values: {cop_stats['cop_values'][-5:]}")
    
    return jsonify(cop_stats)


@app.route('/debug/test-cop-calculation', methods=['POST'])
def debug_test_cop_calculation():
    """Test COP calculation with sample data"""
    
    # Test with known good values
    test_data = {
        'Compressor 1 Current': 45.5,
        'Compressor 2 Current': 43.2,
        'Cooler Water In Temp': 55.0,
        'Cooler Water Out Temp': 44.0,
        'Comp 1 FLA': 50,
        'Comp 2 FLA': 50,
        'Discharge Pressure 1': 185.0,
        'Discharge Pressure 2': 180.0,
        'Suction Pressure 1': 45.0,
        'Suction Pressure 2': 44.0,
    }
    
    print("\n" + "="*70)
    print("🧪 TESTING COP CALCULATION WITH KNOWN VALUES")
    print("="*70)
    
    df = pd.DataFrame([test_data])
    processed_df = processor.process_dataset(df)
    
    if len(processed_df) > 0:
        row = processed_df.iloc[0]
        
        result = {
            'input_data': test_data,
            'operational_mode': int(row['operational_mode']),
            'calculated_cop': float(row['cop']) if pd.notna(row['cop']) else None,
            'water_delta_t': test_data['Cooler Water In Temp'] - test_data['Cooler Water Out Temp'],
            'total_current': test_data['Compressor 1 Current'] + test_data['Compressor 2 Current'],
            'expected_cop_range': '2.5 to 4.5',
            'calculation_details': {
                'delta_t': test_data['Cooler Water In Temp'] - test_data['Cooler Water Out Temp'],
                'cooling_capacity_tons': (100 * 11.0 * 500 / 12000),
                'total_current': 88.7,
                'power_kw': (88.7 * 480 * 1.732 * 0.85) / 1000,
                'expected_cop': '~3.5'
            }
        }
        
        print(f"\n✅ Test Results:")
        print(f"   Operational Mode: {result['operational_mode']}")
        print(f"   Calculated COP: {result['calculated_cop']}")
        print(f"   Expected COP: {result['expected_cop_range']}")
        
        if result['calculated_cop'] is not None:
            print(f"   ✅ COP calculation is working!")
        else:
            print(f"   ❌ COP calculation returned None")
        
        print("="*70 + "\n")
        
        return jsonify(result), 200
    else:
        return jsonify({'error': 'Processing failed'}), 500

def process_chiller_data(df, is_realtime=False):
    """Process chiller data and return analysis results"""
    
    mode_str = "REAL-TIME" if is_realtime else "STATIC"
    print(f"\n🔧 Processing {mode_str} data...")
    
    # Process dataset
    processed_df = processor.process_dataset(df)
    
    # Prepare ML features
    df_pm, df_ee = processor.prepare_ml_features(processed_df)
    
    results = {
        'summary': {
            'total_records': int(len(processed_df)),
            'operational_records': int(len(processed_df[processed_df['operational_mode'] > 0])),
            'mode_0_count': int(len(processed_df[processed_df['operational_mode'] == 0])),
            'mode_1_count': int(len(processed_df[processed_df['operational_mode'] == 1])),
            'mode_2_count': int(len(processed_df[processed_df['operational_mode'] == 2]))
        },
        'predictive_maintenance': {},
        'energy_efficiency': {},
        'alerts': [],
        'timeseries_data': []
    }
    
    print(f"\n📊 Summary:")
    print(f"  - Total: {results['summary']['total_records']}")
    print(f"  - Operational: {results['summary']['operational_records']}")
    print(f"  - Mode 0: {results['summary']['mode_0_count']}")
    print(f"  - Mode 1: {results['summary']['mode_1_count']}")
    print(f"  - Mode 2: {results['summary']['mode_2_count']}")
    
    # Predictive Maintenance Analysis
    if df_pm is not None and len(df_pm) > 0 and pm_model.model is not None:
        try:
            print("\n🤖 Running Predictive Maintenance analysis...")
            predictions = pm_model.predict(df_pm)
            anomalies, errors = pm_model.detect_anomalies(df_pm)
            feature_importance = pm_model.get_feature_importance()
            
            results['predictive_maintenance'] = {
                'anomaly_count': int(np.sum(anomalies)),
                'anomaly_percentage': float(np.sum(anomalies) / len(anomalies) * 100),
                'feature_importance': feature_importance.head(10).to_dict('records'),
                'anomaly_indices': np.where(anomalies)[0].tolist(),
                'max_error': float(np.max(errors)),
                'mean_error': float(np.mean(errors))
            }
            
            print(f"  ✅ Anomalies detected: {results['predictive_maintenance']['anomaly_count']}")
            
            # Generate alerts
            for idx in np.where(anomalies)[0]:
                alert = generate_maintenance_alert(
                    processed_df.iloc[idx], 
                    df_pm.iloc[idx], 
                    float(errors[idx])
                )
                results['alerts'].append(alert)
        
        except Exception as e:
            print(f"  ⚠️ PM Error: {e}")
            results['predictive_maintenance']['error'] = str(e)
    
    # Energy Efficiency Analysis
    if df_ee is not None and len(df_ee) > 0 and ee_model.model is not None:
        try:
            print("\n⚡ Running Energy Efficiency analysis...")
            predictions = ee_model.predict(df_ee)
            scores = ee_model.get_anomaly_scores(df_ee)
            
            # Calculate average COP safely
            cop_values = processed_df['cop'].replace([np.inf, -np.inf], np.nan).dropna()
            avg_cop = float(cop_values.mean()) if len(cop_values) > 0 else None
            
            results['energy_efficiency'] = {
                'inefficient_count': int(np.sum(predictions == -1)),
                'inefficient_percentage': float(np.sum(predictions == -1) / len(predictions) * 100),
                'average_cop': avg_cop,
                'min_anomaly_score': float(np.min(scores)),
                'mean_anomaly_score': float(np.mean(scores))
            }
            
            print(f"  ✅ Inefficient points: {results['energy_efficiency']['inefficient_count']}")
            print(f"  ✅ Average COP: {results['energy_efficiency']['average_cop']}")
            
            # Generate optimization alerts
            inefficient_indices = np.where(predictions == -1)[0][:5]
            for idx in inefficient_indices:
                alert = generate_optimization_alert(
                    processed_df.iloc[idx], 
                    scores[idx]
                )
                results['alerts'].append(alert)
        
        except Exception as e:
            print(f"  ⚠️ EE Error: {e}")
            results['energy_efficiency']['error'] = str(e)
    
    # Prepare timeseries data
    print("\n📈 Preparing timeseries data...")
    for idx, row in processed_df.iterrows():
        point = {
            'timestamp': str(row.get('timestamp', idx)),
            'operational_mode': int(row['operational_mode']),
            'comp1_current': float(row.get('Compressor 1 Current', 0) or 0),
            'comp2_current': float(row.get('Compressor 2 Current', 0) or 0),
            'discharge_pressure_1': float(row.get('Discharge Pressure 1', 0) or 0),
            'discharge_pressure_2': float(row.get('Discharge Pressure 2', 0) or 0),
            'suction_pressure_1': float(row.get('Suction Pressure 1', 0) or 0),
            'suction_pressure_2': float(row.get('Suction Pressure 2', 0) or 0),
            'water_in_temp': float(row.get('Cooler Water In Temp', 0) or 0),
            'water_out_temp': float(row.get('Cooler Water Out Temp', 0) or 0),
            'cop': float(row.get('cop', 0) or 0) if row.get('cop') is not None else 0,
            'has_anomaly': bool(row.get('has_anomaly', False))
        }
        results['timeseries_data'].append(point)
    
    # Sort alerts
    results['alerts'].sort(key=lambda x: {'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3}.get(x['severity'], 4))
    
    print(f"  ✅ Generated {len(results['alerts'])} alerts")
    print(f"  ✅ Prepared {len(results['timeseries_data'])} timeseries points")
    
    return results


def generate_maintenance_alert(row, features, error):
    """Generate maintenance alert"""
    alert = {
        'type': 'MAINTENANCE',
        'severity': 'HIGH' if error > (pm_model.threshold * 1.5 if pm_model.threshold else 50) else 'MEDIUM',
        'timestamp': str(row.get('timestamp', datetime.now().isoformat())),
        'message': 'Anomaly detected in system operation',
        'parameters': {},
        'recommendations': []
    }
    
    comp1_current = float(row.get('Compressor 1 Current', 0) or 0)
    comp1_fla_percent = float(row.get('comp1_fla_percent', 0) or 0)
    
    if comp1_fla_percent > 100:
        alert['severity'] = 'CRITICAL'
        alert['message'] = f'Compressor 1 overcurrent detected ({comp1_fla_percent:.1f}% FLA)'
        alert['parameters']['Compressor 1 Current'] = comp1_current
        alert['recommendations'].append('Immediate inspection required - Check motor and refrigerant charge')
    
    oil_pressure = float(row.get('Oil Pressure Diff 1', 0) or 0)
    if oil_pressure < 20 and comp1_current > 0:
        alert['severity'] = 'CRITICAL'
        alert['message'] = f'Low oil pressure differential ({oil_pressure:.1f} psi)'
        alert['parameters']['Oil Pressure Diff 1'] = oil_pressure
        alert['recommendations'].append('Check oil level and oil pump - Risk of bearing failure')
    
    discharge_temp = float(row.get('Discharge Temperature 1', 0) or 0)
    if discharge_temp > 220 and comp1_current > 0:
        alert['severity'] = 'HIGH'
        alert['message'] = f'High discharge temperature ({discharge_temp:.1f}°F)'
        alert['parameters']['Discharge Temperature 1'] = discharge_temp
        alert['recommendations'].append('Check refrigerant charge and condenser cleanliness')
    
    comp2_current = float(row.get('Compressor 2 Current', 0) or 0)
    comp2_fla_percent = float(row.get('comp2_fla_percent', 0) or 0)
    
    if comp2_fla_percent > 100:
        alert['severity'] = 'CRITICAL'
        alert['message'] = f'Compressor 2 overcurrent detected ({comp2_fla_percent:.1f}% FLA)'
        alert['parameters']['Compressor 2 Current'] = comp2_current
        alert['recommendations'].append('Immediate inspection required - Check motor and refrigerant charge')
    
    if not alert['recommendations']:
        alert['recommendations'].append('Review all operational parameters for anomalies')
    
    return alert



def generate_optimization_alert(row, score):
    """Generate optimization alert"""
    alert = {
        'type': 'OPTIMIZATION',
        'severity': 'MEDIUM',
        'timestamp': str(row.get('timestamp', datetime.now().isoformat())),
        'message': 'Energy efficiency optimization opportunity',
        'parameters': {},
        'recommendations': []
    }
    
    cop = float(row.get('cop', 0) or 0)
    if cop and cop < 3.0:
        alert['severity'] = 'HIGH'
        alert['message'] = f'Low system efficiency (COP: {cop:.2f})'
        alert['parameters']['COP'] = cop
        alert['recommendations'].append('Review chilled water setpoint - Consider increasing outlet temperature')
        alert['recommendations'].append('Check condenser fan operation and staging')
    
    if not alert['recommendations']:
        alert['recommendations'].append('Review control setpoints for energy optimization')
    
    return alert



if __name__ == '__main__':
    os.makedirs('models', exist_ok=True)
    
    print("\n" + "="*70)
    print("🌐 STARTING FLASK SERVER")
    print("="*70)
    print(f"📍 Server URL: http://localhost:5000")
    print(f"📍 Health Check: http://localhost:5000/health")
    print(f"📍 CORS Enabled for: http://localhost:3000")
    print("="*70)
    print("\n✅ Server is ready to receive requests!\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)