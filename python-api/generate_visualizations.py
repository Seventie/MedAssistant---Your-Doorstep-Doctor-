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

# Set up matplotlib for better-looking plots
plt.style.use('default')
sns.set_palette("husl")

# Create output directory
os.makedirs('../public/visualizations', exist_ok=True)

def create_ner_visualizations():
    """Create NER entity visualizations from ner_entities.csv"""
    print("📊 Creating NER visualizations...")
    
    try:
        # Load NER data
        ner_df = pd.read_csv('kg_rag_artifacts/ner_entities.csv')
        print(f"✅ Loaded {len(ner_df)} NER entities")
        
        # 1. Entity Type Distribution
        plt.figure(figsize=(12, 8))
        entity_counts = ner_df.groupby('entity_label').size().sort_values(ascending=False)
        
        # Create bar plot
        ax = entity_counts.head(15).plot(kind='bar', color='skyblue', edgecolor='darkblue')
        plt.title('Top 15 Medical Entity Types Distribution', fontsize=16, fontweight='bold')
        plt.xlabel('Entity Type', fontsize=12)
        plt.ylabel('Frequency', fontsize=12)
        plt.xticks(rotation=45, ha='right')
        plt.grid(axis='y', alpha=0.3)
        
        # Add value labels on bars
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
            ner_df['text_length'] = ner_df['entity_text'].str.len()
            
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

def create_knowledge_graph_visualizations():
    """Create Knowledge Graph visualizations from medical_kg.graphml"""
    print("🕸️ Creating Knowledge Graph visualizations...")
    
    try:
        # Load knowledge graph
        G = nx.read_graphml('kg_rag_artifacts/medical_kg.graphml')
        print(f"✅ Loaded graph with {G.number_of_nodes()} nodes and {G.number_of_edges()} edges")
        
        # 1. Network Overview
        plt.figure(figsize=(16, 12))
        
        # Use spring layout for better visualization
        pos = nx.spring_layout(G, k=1, iterations=50)
        
        # Draw nodes with different colors based on degree
        node_degrees = dict(G.degree())
        node_colors = [node_degrees[node] for node in G.nodes()]
        
        nx.draw_networkx_nodes(G, pos, node_color=node_colors, node_size=30, 
                              cmap='viridis', alpha=0.8)
        nx.draw_networkx_edges(G, pos, alpha=0.3, width=0.5, edge_color='gray')
        
        plt.title('Medical Knowledge Graph Network', fontsize=18, fontweight='bold')
        plt.colorbar(plt.cm.ScalarMappable(cmap='viridis'), label='Node Degree')
        plt.axis('off')
        
        plt.tight_layout()
        plt.savefig('../public/visualizations/knowledge_graph_network.png', dpi=300, bbox_inches='tight')
        plt.close()
        
        # 2. Node Degree Distribution
        plt.figure(figsize=(12, 8))
        degrees = [d for n, d in G.degree()]
        
        plt.hist(degrees, bins=30, color='lightgreen', alpha=0.7, edgecolor='darkgreen')
        plt.title('Knowledge Graph - Node Degree Distribution', fontsize=16, fontweight='bold')
        plt.xlabel('Node Degree', fontsize=12)
        plt.ylabel('Number of Nodes', fontsize=12)
        plt.grid(axis='y', alpha=0.3)
        
        plt.tight_layout()
        plt.savefig('../public/visualizations/kg_degree_distribution.png', dpi=300, bbox_inches='tight')
        plt.close()
        
        # 3. Graph Statistics
        plt.figure(figsize=(10, 8))
        stats = {
            'Total Nodes': G.number_of_nodes(),
            'Total Edges': G.number_of_edges(),
            'Average Degree': np.mean([d for n, d in G.degree()]),
            'Density': nx.density(G),
            'Connected Components': nx.number_connected_components(G)
        }
        
        bars = plt.bar(range(len(stats)), list(stats.values()), 
                      color=['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'])
        plt.title('Knowledge Graph Statistics', fontsize=16, fontweight='bold')
        plt.xticks(range(len(stats)), list(stats.keys()), rotation=45, ha='right')
        plt.ylabel('Value')
        
        # Add value labels on bars
        for bar, value in zip(bars, stats.values()):
            plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.01, 
                    f'{value:.2f}', ha='center', va='bottom', fontweight='bold')
        
        plt.tight_layout()
        plt.savefig('../public/visualizations/kg_statistics.png', dpi=300, bbox_inches='tight')
        plt.close()
        
        print("✅ Knowledge Graph visualizations created successfully")
        
    except Exception as e:
        print(f"❌ Error creating Knowledge Graph visualizations: {e}")

def create_embeddings_visualizations():
    """Create embedding visualizations from corpus_embeddings.npy"""
    print("🔍 Creating Embeddings visualizations...")
    
    try:
        # Load embeddings
        embeddings = np.load('kg_rag_artifacts/corpus_embeddings.npy')
        print(f"✅ Loaded embeddings: {embeddings.shape}")
        
        # 1. PCA Visualization (2D)
        plt.figure(figsize=(12, 10))
        pca = PCA(n_components=2)
        embeddings_2d = pca.fit_transform(embeddings)
        
        plt.scatter(embeddings_2d[:, 0], embeddings_2d[:, 1], alpha=0.6, s=20, color='blue')
        plt.title(f'Medical Embeddings - PCA Visualization\n({embeddings.shape[0]} documents, {embeddings.shape[1]}D → 2D)', 
                 fontsize=16, fontweight='bold')
        plt.xlabel(f'PC1 (Explained Variance: {pca.explained_variance_ratio_[0]:.1%})', fontsize=12)
        plt.ylabel(f'PC2 (Explained Variance: {pca.explained_variance_ratio_[1]:.1%})', fontsize=12)
        plt.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig('../public/visualizations/embeddings_pca.png', dpi=300, bbox_inches='tight')
        plt.close()
        
        # 2. t-SNE Visualization (sample for speed)
        plt.figure(figsize=(12, 10))
        sample_size = min(1000, embeddings.shape[0])  # Sample for t-SNE performance
        sample_indices = np.random.choice(embeddings.shape[0], sample_size, replace=False)
        embeddings_sample = embeddings[sample_indices]
        
        tsne = TSNE(n_components=2, random_state=42, perplexity=30)
        embeddings_tsne = tsne.fit_transform(embeddings_sample)
        
        plt.scatter(embeddings_tsne[:, 0], embeddings_tsne[:, 1], alpha=0.7, s=25, color='red')
        plt.title(f'Medical Embeddings - t-SNE Visualization\n(Sample of {sample_size} documents)', 
                 fontsize=16, fontweight='bold')
        plt.xlabel('t-SNE Dimension 1', fontsize=12)
        plt.ylabel('t-SNE Dimension 2', fontsize=12)
        plt.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig('../public/visualizations/embeddings_tsne.png', dpi=300, bbox_inches='tight')
        plt.close()
        
        # 3. K-Means Clustering
        plt.figure(figsize=(12, 10))
        n_clusters = 8
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        cluster_labels = kmeans.fit_predict(embeddings_2d)  # Use PCA embeddings for speed
        
        scatter = plt.scatter(embeddings_2d[:, 0], embeddings_2d[:, 1], 
                            c=cluster_labels, cmap='tab10', alpha=0.7, s=20)
        plt.title(f'Medical Embeddings - K-Means Clustering\n({n_clusters} clusters)', 
                 fontsize=16, fontweight='bold')
        plt.xlabel(f'PC1 (Explained Variance: {pca.explained_variance_ratio_[0]:.1%})', fontsize=12)
        plt.ylabel(f'PC2 (Explained Variance: {pca.explained_variance_ratio_[1]:.1%})', fontsize=12)
        plt.colorbar(scatter, label='Cluster')
        plt.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig('../public/visualizations/embeddings_clusters.png', dpi=300, bbox_inches='tight')
        plt.close()
        
        # 4. Embedding Statistics
        plt.figure(figsize=(15, 5))
        
        # Subplot 1: Embedding dimensions distribution
        plt.subplot(1, 3, 1)
        plt.hist(embeddings.flatten(), bins=50, alpha=0.7, color='purple')
        plt.title('Embedding Values Distribution', fontweight='bold')
        plt.xlabel('Embedding Value')
        plt.ylabel('Frequency')
        
        # Subplot 2: Embedding norms
        plt.subplot(1, 3, 2)
        norms = np.linalg.norm(embeddings, axis=1)
        plt.hist(norms, bins=30, alpha=0.7, color='orange')
        plt.title('Embedding Vector Norms', fontweight='bold')
        plt.xlabel('L2 Norm')
        plt.ylabel('Frequency')
        
        # Subplot 3: Dimension variance
        plt.subplot(1, 3, 3)
        dim_variance = np.var(embeddings, axis=0)
        plt.plot(dim_variance, color='green', linewidth=2)
        plt.title('Variance per Embedding Dimension', fontweight='bold')
        plt.xlabel('Dimension')
        plt.ylabel('Variance')
        
        plt.tight_layout()
        plt.savefig('../public/visualizations/embeddings_statistics.png', dpi=300, bbox_inches='tight')
        plt.close()
        
        print("✅ Embeddings visualizations created successfully")
        
    except Exception as e:
        print(f"❌ Error creating embeddings visualizations: {e}")

def create_overview_diagram():
    """Create system architecture overview"""
    print("🏗️ Creating system architecture diagram...")
    
    try:
        fig, ax = plt.subplots(figsize=(14, 10))
        ax.set_xlim(0, 10)
        ax.set_ylim(0, 10)
        ax.axis('off')
        
        # Title
        ax.text(5, 9.5, 'Medical AI System Architecture', 
               fontsize=20, fontweight='bold', ha='center')
        
        # Components
        components = [
            {'name': 'Frontend\n(React + TypeScript)', 'pos': (2, 8), 'color': '#3B82F6'},
            {'name': 'Q&A Model\n(DPR + FAISS + GROQ)', 'pos': (1, 6), 'color': '#10B981'},
            {'name': 'Recommendations\n(KG + RAG + GROQ)', 'pos': (3, 6), 'color': '#8B5CF6'},
            {'name': 'Drug Search\n(Local CSV + Autocomplete)', 'pos': (5, 6), 'color': '#F59E0B'},
            {'name': 'NER Processing\n(SpaCy + Medical Entities)', 'pos': (1, 4), 'color': '#EF4444'},
            {'name': 'Knowledge Graph\n(NetworkX + GraphML)', 'pos': (3, 4), 'color': '#06B6D4'},
            {'name': 'Vector Embeddings\n(FAISS + Sentence Transformers)', 'pos': (5, 4), 'color': '#84CC16'},
            {'name': 'Medical Database\n(2931+ Drugs)', 'pos': (8, 6), 'color': '#F97316'},
        ]
        
        # Draw components
        for comp in components:
            # Draw box
            rect = plt.Rectangle((comp['pos'][0]-0.8, comp['pos'][1]-0.4), 1.6, 0.8, 
                               facecolor=comp['color'], alpha=0.3, edgecolor=comp['color'], linewidth=2)
            ax.add_patch(rect)
            # Add text
            ax.text(comp['pos'][0], comp['pos'][1], comp['name'], 
                   ha='center', va='center', fontsize=10, fontweight='bold')
        
        # Draw arrows (connections)
        arrows = [
            ((2, 7.6), (1, 6.4)),  # Frontend → Q&A
            ((2, 7.6), (3, 6.4)),  # Frontend → Recommendations  
            ((2, 7.6), (5, 6.4)),  # Frontend → Search
            ((1, 5.6), (1, 4.4)),  # Q&A → NER
            ((3, 5.6), (3, 4.4)),  # Recommendations → KG
            ((5, 5.6), (5, 4.4)),  # Search → Embeddings
            ((5, 6), (8, 6)),      # Search → Database
        ]
        
        for start, end in arrows:
            ax.annotate('', xy=end, xytext=start,
                       arrowprops=dict(arrowstyle='->', lw=2, color='#374151'))
        
        plt.tight_layout()
        plt.savefig('../public/visualizations/system_architecture.png', dpi=300, bbox_inches='tight')
        plt.close()
        
        print("✅ System architecture diagram created successfully")
        
    except Exception as e:
        print(f"❌ Error creating architecture diagram: {e}")

def main():
    """Generate all visualizations"""
    print("🚀 Starting visualization generation...")
    print("📁 Output directory: ../public/visualizations/")
    print("=" * 50)
    
    # Generate all visualizations
    create_ner_visualizations()
    create_knowledge_graph_visualizations() 
    create_embeddings_visualizations()
    create_overview_diagram()
    
    print("=" * 50)
    print("🎉 All visualizations generated successfully!")
    print("📂 Check: public/visualizations/ folder")
    print("🖥️ View them in your frontend Visualizations tab")

if __name__ == "__main__":
    main()
