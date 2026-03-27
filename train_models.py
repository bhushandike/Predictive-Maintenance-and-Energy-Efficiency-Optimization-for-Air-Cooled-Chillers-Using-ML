import pandas as pd
import sys
from data_processor import ChillerDataProcessor
from ml_models import PredictiveMaintenanceModel, EnergyEfficiencyModel

def train_and_save_models(data_file='chiller_data.csv'):
    """Train both models and save them"""
    print("\n" + "="*70)
    print("🚀 STARTING MODEL TRAINING")
    print("="*70)
    
    print(f"\n📁 Loading data from: {data_file}")
    df = pd.read_csv(data_file)
    print(f"✅ Data loaded: {len(df)} rows, {len(df.columns)} columns")
    
    print("\n🔄 Processing data...")
    processor = ChillerDataProcessor()
    processed_df = processor.process_dataset(df)
    
    print("\n📊 Preparing ML features...")
    df_pm, df_ee = processor.prepare_ml_features(processed_df)
    
    if df_pm is None or df_ee is None:
        print("❌ Error: No operational data found")
        return
    
    print(f"\n📈 Features prepared:")
    print(f"  - Predictive Maintenance: {df_pm.shape}")
    print(f"  - Energy Efficiency: {df_ee.shape}")
    
    # Train PM Model
    print("\n" + "="*70)
    print("🤖 TRAINING PREDICTIVE MAINTENANCE MODEL")
    print("="*70)
    pm_model = PredictiveMaintenanceModel()
    pm_model.train(df_pm)
    pm_model.save('models/predictive_maintenance.pkl')
    
    importance = pm_model.get_feature_importance()
    print("\n📊 Top 10 Important Features:")
    print(importance.head(10).to_string(index=False))
    
    # Train EE Model
    print("\n" + "="*70)
    print("⚡ TRAINING ENERGY EFFICIENCY MODEL")
    print("="*70)
    ee_model = EnergyEfficiencyModel()
    ee_model.train(df_ee, contamination=0.1)
    ee_model.save('models/energy_efficiency.pkl')
    
    print("\n" + "="*70)
    print("✅ TRAINING COMPLETED SUCCESSFULLY!")
    print("="*70 + "\n")
    
    return pm_model, ee_model

if __name__ == "__main__":
    if len(sys.argv) > 1:
        data_file = sys.argv[1]
    else:
        data_file = 'chiller_data.csv'
    
    train_and_save_models(data_file)