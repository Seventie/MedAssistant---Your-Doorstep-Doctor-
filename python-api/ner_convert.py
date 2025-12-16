# generate_visualizations.py - Convert your data files to visualization images
import pandas as pd
import numpy as np
import networkx as nx
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
from sklearn.cluster import KMeans
from collections import Counter
import json
import os
def create_ner_visualizations():
    """Create NER entity visualizations from ner_entities.csv"""
    print("📊 Creating NER visualizations...")

    try:
        # Load NER data
        ner_df = pd.read_csv('kg_rag_artifacts/ner_entities.csv')
        print(f"✅ Loaded {len(ner_df)} NER entities")

        # Normalize column names
        ner_df.columns = [c.strip().lower() for c in ner_df.columns]

        # Map to expected names
        if 'label' in ner_df.columns and 'entity' in ner_df.columns:
            ner_df['entity_label'] = ner_df['label']
            ner_df['entity_text'] = ner_df['entity']
        elif 'entity_label' not in ner_df.columns or 'entity_text' not in ner_df.columns:
            raise ValueError("CSV must have at least columns 'entity' and 'label'.")

        # 1. Entity Type Distribution
        plt.figure(figsize=(12, 8))
        entity_counts = ner_df['entity_label'].value_counts().sort_values(ascending=False)

        ax = entity_counts.head(15).plot(kind='bar', color='skyblue', edgecolor='darkblue')
        plt.title('Top 15 Medical Entity Types Distribution', fontsize=16, fontweight='bold')
        plt.xlabel('Entity Type', fontsize=12)
        plt.ylabel('Frequency', fontsize=12)
        plt.xticks(rotation=45, ha='right')
        plt.grid(axis='y', alpha=0.3)

        for i, v in enumerate(entity_counts.head(15)):
            ax.text(i, v + 0.01, str(v), ha='center', va='bottom', fontweight='bold')

        plt.tight_layout()
        plt.savefig('../public/visualizations/ner_entity_distribution.png', dpi=300, bbox_inches='tight')
        plt.close()

        # 2. Entity Frequency Pie Chart
        plt.figure(figsize=(10, 10))
        top_entities = entity_counts.head(10)
        colors = plt.cm.Set3(np.linspace(0, 1, len(top_entities)))

        plt.pie(top_entities.values, labels=top_entities.index, autopct='%1.1f%%',
                colors=colors, startangle=90)
        plt.title('Medical Entity Types - Top 10 Distribution', fontsize=16, fontweight='bold')
        plt.axis('equal')

        plt.tight_layout()
        plt.savefig('../public/visualizations/ner_entity_pie.png', dpi=300, bbox_inches='tight')
        plt.close()

        # 3. Entity Text Length Analysis
        if 'entity_text' in ner_df.columns:
            plt.figure(figsize=(12, 6))
            ner_df['text_length'] = ner_df['entity_text'].astype(str).str.len()

            plt.hist(ner_df['text_length'], bins=30, color='lightcoral', alpha=0.7, edgecolor='darkred')
            plt.title('Distribution of Entity Text Lengths', fontsize=16, fontweight='bold')
            plt.xlabel('Text Length (characters)', fontsize=12)
            plt.ylabel('Frequency', fontsize=12)
            plt.grid(axis='y', alpha=0.3)

            plt.tight_layout()
            plt.savefig('../public/visualizations/ner_text_lengths.png', dpi=300, bbox_inches='tight')
            plt.close()

        print("✅ NER visualizations created successfully")

    except Exception as e:
        print(f"❌ Error creating NER visualizations: {e}")
create_ner_visualizations()