import pandas as pd
import numpy as np
from datetime import datetime

class ChillerDataProcessor:
    """Process chiller data and determine operational modes"""
    
    # ===== CLASS ATTRIBUTES - MUST BE HERE =====
    PREDICTIVE_MAINTENANCE_PARAMS = {
        'comp1': [
            'Compressor 1 Current',
            'Comp 1 FLA',
            'Compressor 1 On/Off Relay',
            'Discharge Pressure 1',
            'Suction Pressure 1',
            'Suction Superheat 1',
            'Discharge Temperature 1',
            'Oil Pressure Diff 1'
        ],
        'comp2': [
            'Compressor 2 Current',
            'Comp 2 FLA',
            'Compressor 2 On/Off Relay',
            'Discharge Pressure 2',
            'Suction Pressure 2',
            'Suction Superheat 2',
            'Discharge Temperature 2',
            'Oil Pressure Diff 2'
        ],
        'common': [
            'Cooler Water In Temp',
            'Cooler Water Out Temp'
        ]
    }
    
    ENERGY_EFFICIENCY_PARAMS = [
        'CW OUT TRGT',
        'Condenser fan 1 system 1 On/Off Relay',
        'Condenser fan 1 system 2 On/Off Relay',
        'Electronic Expansion Valve 1',
        'Electronic Expansion Valve 2',
        'EXV LOAD ADJ'
    ]
    # ===== END CLASS ATTRIBUTES =====
    
    def __init__(self):
        print("✅ ChillerDataProcessor initialized")
    
    @staticmethod
    def safe_float(value, default=0):
        """Safely convert value to float"""
        if value is None or value == '' or pd.isna(value):
            return default
        try:
            return float(value)
        except (ValueError, TypeError):
            return default
    
    def determine_operational_mode(self, row):
        """Determine operational mode (0, 1, or 2)"""
        comp1_current = self.safe_float(row.get('Compressor 1 Current', 0))
        comp2_current = self.safe_float(row.get('Compressor 2 Current', 0))
        
        comp1_current = max(0, comp1_current)
        comp2_current = max(0, comp2_current)
        
        comp1_on = comp1_current > 0.5  # Noise tolerance
        comp2_on = comp2_current > 0.5
        
        if comp1_on and comp2_on:
            return 2
        elif comp1_on or comp2_on:
            return 1
        else:
            return 0
    
    def detect_anomalies(self, row, operational_mode):
        """Detect anomalies based on operational mode"""
        anomalies = []
        
        comp1_current = self.safe_float(row.get('Compressor 1 Current', 0))
        comp2_current = self.safe_float(row.get('Compressor 2 Current', 0))
        
        comp1_on = comp1_current > 0.5
        comp2_on = comp2_current > 0.5
        
        if comp1_on:
            for param in self.PREDICTIVE_MAINTENANCE_PARAMS['comp1']:
                value = self.safe_float(row.get(param, None), default=None)
                if value is not None and value < 0:
                    anomalies.append({
                        'parameter': param,
                        'value': value,
                        'reason': 'Negative value while compressor 1 is ON',
                        'severity': 'HIGH'
                    })
        
        if comp2_on:
            for param in self.PREDICTIVE_MAINTENANCE_PARAMS['comp2']:
                value = self.safe_float(row.get(param, None), default=None)
                if value is not None and value < 0:
                    anomalies.append({
                        'parameter': param,
                        'value': value,
                        'reason': 'Negative value while compressor 2 is ON',
                        'severity': 'HIGH'
                    })
        
        return anomalies
    
    def calculate_cop(self, row, operational_mode):
        """Calculate Coefficient of Performance - FIXED VERSION WITH DETAILED LOGGING"""
        
        # Return None only for mode 0 (completely off)
        if operational_mode == 0:
            return None
        
        try:
            # Get temperature values
            water_in = self.safe_float(row.get('Cooler Water In Temp', 0))
            water_out = self.safe_float(row.get('Cooler Water Out Temp', 0))
            
            # Calculate temperature difference
            delta_t = water_in - water_out
            
            # ===== DETAILED LOGGING =====
            print(f"\n  🔍 COP Calculation Attempt:")
            print(f"     Operational Mode: {operational_mode}")
            print(f"     Water In: {water_in:.2f}°F")
            print(f"     Water Out: {water_out:.2f}°F")
            print(f"     Delta T: {delta_t:.2f}°F")
            # ===== END LOGGING =====
            
            # More lenient delta_t check
            if delta_t <= 0.1:
                print(f"     ❌ REJECTED: Delta T too low ({delta_t:.2f}°F)")
                return None
            
            # Cooling capacity calculation (BTU/hr)
            gpm = 100  # Flow rate assumption
            cooling_capacity = gpm * delta_t * 500 / 12000  # Result in tons
            
            # Get compressor currents
            comp1_current = self.safe_float(row.get('Compressor 1 Current', 0))
            comp2_current = self.safe_float(row.get('Compressor 2 Current', 0))
            
            total_current = comp1_current + comp2_current
            
            print(f"     Comp1 Current: {comp1_current:.2f}A")
            print(f"     Comp2 Current: {comp2_current:.2f}A")
            print(f"     Total Current: {total_current:.2f}A")
            
            # More lenient current check
            if total_current < 0.5:
                print(f"     ❌ REJECTED: Total current too low ({total_current:.2f}A)")
                return None
            
            # Power calculation
            voltage = 480
            power_factor = 0.85
            power_kw = (total_current * voltage * np.sqrt(3) * power_factor) / 1000
            
            if power_kw <= 0:
                print(f"     ❌ REJECTED: Power KW is zero or negative")
                return None
            
            # Calculate COP
            cop = (cooling_capacity * 3.517) / power_kw
            
            print(f"     Cooling Capacity: {cooling_capacity:.2f} tons")
            print(f"     Power: {power_kw:.2f} kW")
            print(f"     Calculated COP: {cop:.2f}")
            
            # More lenient COP validation (0.5 to 15 range)
            if cop is None or np.isnan(cop) or np.isinf(cop):
                print(f"     ❌ REJECTED: COP is NaN or Inf")
                return None
            
            if cop < 0.5:
                print(f"     ❌ REJECTED: COP too low ({cop:.2f} < 0.5)")
                return None
                
            if cop > 15:
                print(f"     ❌ REJECTED: COP too high ({cop:.2f} > 15)")
                return None
            
            print(f"     ✅ ACCEPTED: COP = {cop:.2f}")
            return round(cop, 2)
        
        except Exception as e:
            print(f"     ❌ ERROR: {str(e)}")
            return None
    
    def calculate_compressor_ratio(self, row, comp_num=1):
        """Calculate compression ratio"""
        try:
            discharge = self.safe_float(row.get(f'Discharge Pressure {comp_num}', 0))
            suction = self.safe_float(row.get(f'Suction Pressure {comp_num}', 0))
            
            if suction < 1 or discharge < 1:
                return None
            
            ratio = discharge / suction
            
            if ratio is None or np.isnan(ratio) or np.isinf(ratio):
                return None
                
            if ratio < 1 or ratio > 50:
                return None
            
            return round(ratio, 2)
        except Exception as e:
            return None
    
    def calculate_efficiency_metrics(self, row, operational_mode):
        """Calculate efficiency metrics"""
        metrics = {}
        
        metrics['cop'] = self.calculate_cop(row, operational_mode)
        
        if operational_mode >= 1:
            metrics['compression_ratio_1'] = self.calculate_compressor_ratio(row, 1)
        if operational_mode == 2:
            metrics['compression_ratio_2'] = self.calculate_compressor_ratio(row, 2)
        
        water_in = self.safe_float(row.get('Cooler Water In Temp', 0))
        water_out = self.safe_float(row.get('Cooler Water Out Temp', 0))
        approach = water_in - water_out
        metrics['approach_temp'] = round(approach, 2) if approach > 0 else None
        
        comp1_current = self.safe_float(row.get('Compressor 1 Current', 0))
        comp1_fla = self.safe_float(row.get('Comp 1 FLA', 1), default=1)
        if comp1_fla > 0:
            metrics['comp1_fla_percent'] = round((comp1_current / comp1_fla * 100), 2)
        
        if operational_mode == 2:
            comp2_current = self.safe_float(row.get('Compressor 2 Current', 0))
            comp2_fla = self.safe_float(row.get('Comp 2 FLA', 1), default=1)
            if comp2_fla > 0:
                metrics['comp2_fla_percent'] = round((comp2_current / comp2_fla * 100), 2)
        
        return metrics
    
    def process_dataset(self, df):
        """Process entire dataset"""
        print(f"🔄 Processing {len(df)} rows...")
        
        # ===== FIX: SWAP WATER TEMPERATURES =====
        # Check if temperatures are backwards
        if 'Cooler Water In Temp' in df.columns and 'Cooler Water Out Temp' in df.columns:
            # Sample first few operational rows
            sample = df.head(10)
            water_in_avg = sample['Cooler Water In Temp'].mean()
            water_out_avg = sample['Cooler Water Out Temp'].mean()
            
            # If water out is hotter than water in, they're swapped!
            if water_out_avg > water_in_avg:
                print("⚠️  WARNING: Water temperatures appear to be swapped!")
                print(f"   Water In Avg: {water_in_avg:.1f}°F")
                print(f"   Water Out Avg: {water_out_avg:.1f}°F")
                print("   🔄 SWAPPING columns...")
                
                # Swap them
                df['Cooler Water In Temp'], df['Cooler Water Out Temp'] = \
                    df['Cooler Water Out Temp'].copy(), df['Cooler Water In Temp'].copy()
                
                print("   ✅ Columns swapped!")
        # ===== END FIX =====
        
        # Clean data
        numeric_columns = []
        for param_group in self.PREDICTIVE_MAINTENANCE_PARAMS.values():
            if isinstance(param_group, list):
                numeric_columns.extend(param_group)
        
        numeric_columns.extend(self.ENERGY_EFFICIENCY_PARAMS)

        
        for col in numeric_columns:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        
        print("✅ Data cleaned and converted to numeric types")
        
        processed_data = []
        cop_success_count = 0
        cop_fail_count = 0
        
        for idx, row in df.iterrows():
            if idx % 1000 == 0 and idx > 0:
                print(f"  ⏳ Processed {idx}/{len(df)} rows... (COP: {cop_success_count} success, {cop_fail_count} fail)")
            
            op_mode = self.determine_operational_mode(row)
            anomalies = self.detect_anomalies(row, op_mode)
            efficiency_metrics = self.calculate_efficiency_metrics(row, op_mode)
            
            # Track COP success/failure
            if efficiency_metrics.get('cop') is not None:
                cop_success_count += 1
            elif op_mode > 0:
                cop_fail_count += 1
            
            processed_row = {
                'timestamp': row.get('ENTRYDATE', datetime.now()),
                'operational_mode': op_mode,
                'anomalies': anomalies,
                'has_anomaly': len(anomalies) > 0,
                **efficiency_metrics
            }
            
            for col in df.columns:
                if col not in processed_row:
                    processed_row[col] = row[col]
            
            processed_data.append(processed_row)
        
        print(f"✅ Processing complete!")
        print(f"📊 COP Statistics: {cop_success_count} successful, {cop_fail_count} failed")
        if (cop_success_count + cop_fail_count) > 0:
            success_rate = (cop_success_count / (cop_success_count + cop_fail_count) * 100)
            print(f"   Success rate: {success_rate:.1f}%")
        
        return pd.DataFrame(processed_data)
    
    def prepare_ml_features(self, df):
        """Prepare features for ML models"""
        df_operational = df[df['operational_mode'] > 0].copy()
        
        if len(df_operational) == 0:
            print("⚠️ Warning: No operational data found")
            return None, None
        
        print(f"✅ Found {len(df_operational)} operational records")
        
        pm_features = []
        for comp_params in self.PREDICTIVE_MAINTENANCE_PARAMS.values():
            if isinstance(comp_params, list):
                pm_features.extend(comp_params)
        
        ee_features = self.ENERGY_EFFICIENCY_PARAMS.copy()
        ee_features.extend(['cop', 'compression_ratio_1', 'approach_temp', 'comp1_fla_percent'])
        
        pm_features = [f for f in pm_features if f in df_operational.columns]
        ee_features = [f for f in ee_features if f in df_operational.columns]
        
        print(f"✅ PM features: {len(pm_features)}, EE features: {len(ee_features)}")
        
        df_pm = df_operational[pm_features].fillna(0)
        df_ee = df_operational[ee_features].fillna(0)
        
        df_pm = df_pm.replace([np.inf, -np.inf], 0)
        df_ee = df_ee.replace([np.inf, -np.inf], 0)
        
        return df_pm, df_ee