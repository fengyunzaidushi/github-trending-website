import psycopg2
from dotenv import load_dotenv
import os
import sys
from datetime import datetime

# Load environment variables from .env
load_dotenv('../.env.local')

# 获取session pooler的数据参考文件 ./scripts/session_poller参数获取.md
# Fetch database connection variables
USER = os.getenv("user1")
PASSWORD = os.getenv("password1")
HOST = os.getenv("host1")
PORT = os.getenv("port1")
DBNAME = os.getenv("dbname1")

# System objects to exclude from deletion (PostgreSQL system objects)
SYSTEM_SCHEMAS = ['information_schema', 'pg_catalog', 'pg_toast', 'pg_temp_1', 'pg_toast_temp_1']
SYSTEM_FUNCTIONS = ['auth.', 'extensions.', 'pgbouncer.', 'pgsodium.', 'vault.', 'graphql.', 'realtime.']
SYSTEM_TABLES = ['auth.', 'extensions.', 'pgbouncer.', 'pgsodium.', 'vault.', 'graphql.', 'realtime.', 'storage.']

def get_user_tables(cursor):
    """Get all user-created tables in public schema"""
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
    """)
    tables = [row[0] for row in cursor.fetchall()]
    return [t for t in tables if not any(t.startswith(sys) for sys in SYSTEM_TABLES)]

def get_user_views(cursor):
    """Get all user-created views in public schema"""
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'VIEW'
        ORDER BY table_name;
    """)
    views = [row[0] for row in cursor.fetchall()]
    return [v for v in views if not any(v.startswith(sys) for sys in SYSTEM_TABLES)]

def get_user_functions(cursor):
    """Get all user-created functions in public schema"""
    cursor.execute("""
        SELECT routine_name, routine_type
        FROM information_schema.routines
        WHERE routine_schema = 'public'
        ORDER BY routine_name;
    """)
    functions = [(row[0], row[1]) for row in cursor.fetchall()]
    return [(f, t) for f, t in functions if not any(f.startswith(sys) for sys in SYSTEM_FUNCTIONS)]

def get_user_triggers(cursor):
    """Get all user-created triggers in public schema"""
    cursor.execute("""
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
        ORDER BY trigger_name;
    """)
    return cursor.fetchall()

def get_user_indexes(cursor):
    """Get all user-created indexes in public schema (excluding primary key indexes)"""
    cursor.execute("""
        SELECT indexname, tablename
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND indexname NOT LIKE '%_pkey'
        ORDER BY indexname;
    """)
    return cursor.fetchall()

def get_user_enums(cursor):
    """Get all user-created enum types in public schema"""
    cursor.execute("""
        SELECT t.typname
        FROM pg_type t 
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public' 
        AND t.typtype = 'e'
        ORDER BY t.typname;
    """)
    return [row[0] for row in cursor.fetchall()]

def get_user_policies(cursor):
    """Get all RLS policies in public schema"""
    cursor.execute("""
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname;
    """)
    return cursor.fetchall()

def get_user_sequences(cursor):
    """Get all user-created sequences in public schema"""
    cursor.execute("""
        SELECT sequence_name
        FROM information_schema.sequences
        WHERE sequence_schema = 'public'
        ORDER BY sequence_name;
    """)
    return [row[0] for row in cursor.fetchall()]

def clean_database(confirm=True, cleanup_types=None):
    """
    Clean all user-created database objects
    
    Args:
        confirm (bool): Whether to ask for confirmation before cleaning
        cleanup_types (list): List of object types to clean. If None, clean all types.
                              Options: ['tables', 'views', 'functions', 'triggers', 'indexes', 'enums', 'policies', 'sequences']
    """
    
    if cleanup_types is None:
        cleanup_types = ['policies', 'triggers', 'indexes', 'views', 'tables', 'functions', 'sequences', 'enums']
    
    print(f"🧹 Database Cleanup Script")
    print("="*50)
    print(f"🎯 Cleanup types: {', '.join(cleanup_types)}")
    
    try:
        # Connect to the database
        connection = psycopg2.connect(
            user=USER,
            password=PASSWORD,
            host=HOST,
            port=PORT,
            dbname=DBNAME
        )
        print(f"\n✅ Database connection successful!")
        
        cursor = connection.cursor()
        
        # Collect all objects to be deleted
        cleanup_summary = {}
        
        if 'tables' in cleanup_types:
            tables = get_user_tables(cursor)
            cleanup_summary['tables'] = tables
            
        if 'views' in cleanup_types:
            views = get_user_views(cursor)
            cleanup_summary['views'] = views
            
        if 'functions' in cleanup_types:
            functions = get_user_functions(cursor)
            cleanup_summary['functions'] = functions
            
        if 'triggers' in cleanup_types:
            triggers = get_user_triggers(cursor)
            cleanup_summary['triggers'] = triggers
            
        if 'indexes' in cleanup_types:
            indexes = get_user_indexes(cursor)
            cleanup_summary['indexes'] = indexes
            
        if 'enums' in cleanup_types:
            enums = get_user_enums(cursor)
            cleanup_summary['enums'] = enums
            
        if 'policies' in cleanup_types:
            policies = get_user_policies(cursor)
            cleanup_summary['policies'] = policies
            
        if 'sequences' in cleanup_types:
            sequences = get_user_sequences(cursor)
            cleanup_summary['sequences'] = sequences
        
        # Display what will be deleted
        print(f"\n📋 Objects to be deleted:")
        total_objects = 0
        
        for obj_type, objects in cleanup_summary.items():
            if objects:
                print(f"\n  {obj_type.upper()}:")
                if obj_type in ['functions', 'triggers', 'indexes', 'policies']:
                    for obj in objects:
                        if isinstance(obj, tuple):
                            print(f"    - {obj[0]} (on {obj[1] if len(obj) > 1 else 'N/A'})")
                        else:
                            print(f"    - {obj}")
                        total_objects += 1
                else:
                    for obj in objects:
                        print(f"    - {obj}")
                        total_objects += 1
        
        if total_objects == 0:
            print("  📭 No user-created objects found to delete.")
            return
        
        print(f"\n📊 Total objects to delete: {total_objects}")
        
        if confirm:
            print(f"\n⚠️  WARNING: This operation will permanently delete ALL user-created database objects!")
            print(f"⚠️  This includes ALL DATA in all tables!")
            response = input("\nAre you absolutely sure you want to continue? (type 'DELETE_ALL' to confirm): ")
            if response != 'DELETE_ALL':
                print("Operation cancelled.")
                return
        
        # Start deletion process
        print(f"\n🚀 Starting cleanup process...")
        deleted_objects = {}
        failed_objects = {}
        
        # 1. Drop RLS Policies first
        if 'policies' in cleanup_types and 'policies' in cleanup_summary:
            print(f"\n🔒 Dropping RLS policies...")
            deleted_objects['policies'] = []
            failed_objects['policies'] = []
            
            for policy_name, table_name in cleanup_summary['policies']:
                try:
                    drop_query = f"DROP POLICY IF EXISTS \"{policy_name}\" ON public.{table_name};"
                    cursor.execute(drop_query)
                    connection.commit()
                    print(f"   ✅ Dropped policy: {policy_name} on {table_name}")
                    deleted_objects['policies'].append((policy_name, table_name))
                except Exception as e:
                    print(f"   ❌ Failed to drop policy {policy_name}: {str(e)}")
                    failed_objects['policies'].append((policy_name, str(e)))
                    connection.rollback()
        
        # 2. Drop Triggers
        if 'triggers' in cleanup_types and 'triggers' in cleanup_summary:
            print(f"\n⚡ Dropping triggers...")
            deleted_objects['triggers'] = []
            failed_objects['triggers'] = []
            
            for trigger_name, table_name in cleanup_summary['triggers']:
                try:
                    drop_query = f"DROP TRIGGER IF EXISTS {trigger_name} ON public.{table_name};"
                    cursor.execute(drop_query)
                    connection.commit()
                    print(f"   ✅ Dropped trigger: {trigger_name} on {table_name}")
                    deleted_objects['triggers'].append((trigger_name, table_name))
                except Exception as e:
                    print(f"   ❌ Failed to drop trigger {trigger_name}: {str(e)}")
                    failed_objects['triggers'].append((trigger_name, str(e)))
                    connection.rollback()
        
        # 3. Drop Indexes (non-primary key)
        if 'indexes' in cleanup_types and 'indexes' in cleanup_summary:
            print(f"\n🗂️  Dropping indexes...")
            deleted_objects['indexes'] = []
            failed_objects['indexes'] = []
            
            for index_name, table_name in cleanup_summary['indexes']:
                try:
                    drop_query = f"DROP INDEX IF EXISTS public.{index_name};"
                    cursor.execute(drop_query)
                    connection.commit()
                    print(f"   ✅ Dropped index: {index_name} on {table_name}")
                    deleted_objects['indexes'].append((index_name, table_name))
                except Exception as e:
                    print(f"   ❌ Failed to drop index {index_name}: {str(e)}")
                    failed_objects['indexes'].append((index_name, str(e)))
                    connection.rollback()
        
        # 4. Drop Views
        if 'views' in cleanup_types and 'views' in cleanup_summary:
            print(f"\n👁️  Dropping views...")
            deleted_objects['views'] = []
            failed_objects['views'] = []
            
            for view_name in cleanup_summary['views']:
                try:
                    drop_query = f"DROP VIEW IF EXISTS public.{view_name} CASCADE;"
                    cursor.execute(drop_query)
                    connection.commit()
                    print(f"   ✅ Dropped view: {view_name}")
                    deleted_objects['views'].append(view_name)
                except Exception as e:
                    print(f"   ❌ Failed to drop view {view_name}: {str(e)}")
                    failed_objects['views'].append((view_name, str(e)))
                    connection.rollback()
        
        # 5. Drop Tables
        if 'tables' in cleanup_types and 'tables' in cleanup_summary:
            print(f"\n🗃️  Dropping tables...")
            deleted_objects['tables'] = []
            failed_objects['tables'] = []
            
            for table_name in cleanup_summary['tables']:
                try:
                    drop_query = f"DROP TABLE IF EXISTS public.{table_name} CASCADE;"
                    cursor.execute(drop_query)
                    connection.commit()
                    print(f"   ✅ Dropped table: {table_name}")
                    deleted_objects['tables'].append(table_name)
                except Exception as e:
                    print(f"   ❌ Failed to drop table {table_name}: {str(e)}")
                    failed_objects['tables'].append((table_name, str(e)))
                    connection.rollback()
        
        # 6. Drop Functions
        if 'functions' in cleanup_types and 'functions' in cleanup_summary:
            print(f"\n⚙️  Dropping functions...")
            deleted_objects['functions'] = []
            failed_objects['functions'] = []
            
            for function_name, function_type in cleanup_summary['functions']:
                try:
                    if function_type.upper() == 'FUNCTION':
                        drop_query = f"DROP FUNCTION IF EXISTS public.{function_name} CASCADE;"
                    else:  # PROCEDURE
                        drop_query = f"DROP PROCEDURE IF EXISTS public.{function_name} CASCADE;"
                    cursor.execute(drop_query)
                    connection.commit()
                    print(f"   ✅ Dropped {function_type.lower()}: {function_name}")
                    deleted_objects['functions'].append((function_name, function_type))
                except Exception as e:
                    print(f"   ❌ Failed to drop {function_type.lower()} {function_name}: {str(e)}")
                    failed_objects['functions'].append((function_name, str(e)))
                    connection.rollback()
        
        # 7. Drop Sequences
        if 'sequences' in cleanup_types and 'sequences' in cleanup_summary:
            print(f"\n🔢 Dropping sequences...")
            deleted_objects['sequences'] = []
            failed_objects['sequences'] = []
            
            for sequence_name in cleanup_summary['sequences']:
                try:
                    drop_query = f"DROP SEQUENCE IF EXISTS public.{sequence_name} CASCADE;"
                    cursor.execute(drop_query)
                    connection.commit()
                    print(f"   ✅ Dropped sequence: {sequence_name}")
                    deleted_objects['sequences'].append(sequence_name)
                except Exception as e:
                    print(f"   ❌ Failed to drop sequence {sequence_name}: {str(e)}")
                    failed_objects['sequences'].append((sequence_name, str(e)))
                    connection.rollback()
        
        # 8. Drop Enums (last, as they might be used by tables)
        if 'enums' in cleanup_types and 'enums' in cleanup_summary:
            print(f"\n🏷️  Dropping enum types...")
            deleted_objects['enums'] = []
            failed_objects['enums'] = []
            
            for enum_name in cleanup_summary['enums']:
                try:
                    drop_query = f"DROP TYPE IF EXISTS public.{enum_name} CASCADE;"
                    cursor.execute(drop_query)
                    connection.commit()
                    print(f"   ✅ Dropped enum type: {enum_name}")
                    deleted_objects['enums'].append(enum_name)
                except Exception as e:
                    print(f"   ❌ Failed to drop enum {enum_name}: {str(e)}")
                    failed_objects['enums'].append((enum_name, str(e)))
                    connection.rollback()
        
        # Final Summary
        print(f"\n{'='*60}")
        print(f"🎯 CLEANUP SUMMARY")
        print(f"{'='*60}")
        
        total_deleted = 0
        total_failed = 0
        
        for obj_type in cleanup_types:
            if obj_type in deleted_objects and deleted_objects[obj_type]:
                print(f"\n✅ Successfully deleted {obj_type.upper()}: {len(deleted_objects[obj_type])}")
                total_deleted += len(deleted_objects[obj_type])
                
            if obj_type in failed_objects and failed_objects[obj_type]:
                print(f"\n❌ Failed to delete {obj_type.upper()}: {len(failed_objects[obj_type])}")
                total_failed += len(failed_objects[obj_type])
                for obj, error in failed_objects[obj_type]:
                    if isinstance(obj, tuple):
                        print(f"   - {obj[0]}: {error}")
                    else:
                        print(f"   - {obj}: {error}")
        
        print(f"\n📊 Total objects deleted: {total_deleted}")
        print(f"📊 Total failures: {total_failed}")
        print(f"\n🕒 Cleanup completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        if total_deleted > 0:
            print(f"\n🎉 Database cleanup successful!")
        
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        sys.exit(1)
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)
        
    finally:
        if 'connection' in locals():
            cursor.close()
            connection.close()
            print("🔌 Database connection closed.")

def main():
    """Main function to run the database cleanup script"""
    print("🧹 Complete Database Cleanup Script")
    print("="*50)
    
    if not all([USER, PASSWORD, HOST, PORT, DBNAME]):
        print("❌ Error: Missing database connection parameters in .env.local file")
        print("Required variables: user, password, host, port, dbname")
        sys.exit(1)
    
    print(f"🔗 Connecting to database: {DBNAME} at {HOST}:{PORT}")
    
    # Check command line arguments for partial cleanup
    if len(sys.argv) > 1:
        cleanup_types = sys.argv[1].split(',')
        valid_types = ['tables', 'views', 'functions', 'triggers', 'indexes', 'enums', 'policies', 'sequences']
        cleanup_types = [t.strip() for t in cleanup_types if t.strip() in valid_types]
        if not cleanup_types:
            print("❌ Invalid cleanup types. Valid options: tables, views, functions, triggers, indexes, enums, policies, sequences")
            sys.exit(1)
        print(f"🎯 Partial cleanup requested: {', '.join(cleanup_types)}")
        clean_database(confirm=True, cleanup_types=cleanup_types)
    else:
        # Full cleanup
        print(f"🎯 Full database cleanup requested")
        clean_database(confirm=True)

if __name__ == "__main__":
    main() 