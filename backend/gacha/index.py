'''
Business: Gacha spin mechanics with cooldown and drop rates
Args: event - dict with httpMethod, headers (X-User-Id)
      context - object with attributes: request_id, function_name
Returns: HTTP response dict with character data or cooldown info
'''

import json
import os
import psycopg2
import random
from typing import Dict, Any
from datetime import datetime, timedelta

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    user_id = headers.get('x-user-id') or headers.get('X-User-Id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'User not authenticated'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            cur.execute(
                "SELECT last_spin_at, free_spins FROM spin_cooldowns WHERE user_id = %s",
                (user_id,)
            )
            cooldown = cur.fetchone()
            
            if not cooldown:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'can_spin': True,
                        'free_spins': 0,
                        'seconds_until_ready': 0
                    }),
                    'isBase64Encoded': False
                }
            
            last_spin = cooldown[0]
            free_spins = cooldown[1]
            next_spin = last_spin + timedelta(minutes=10)
            now = datetime.utcnow()
            
            if free_spins > 0:
                can_spin = True
                seconds_until_ready = 0
            elif now >= next_spin:
                can_spin = True
                seconds_until_ready = 0
            else:
                can_spin = False
                seconds_until_ready = int((next_spin - now).total_seconds())
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'can_spin': can_spin,
                    'free_spins': free_spins,
                    'seconds_until_ready': seconds_until_ready
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            cur.execute(
                "SELECT last_spin_at, free_spins FROM spin_cooldowns WHERE user_id = %s",
                (user_id,)
            )
            cooldown = cur.fetchone()
            now = datetime.utcnow()
            
            if cooldown:
                last_spin = cooldown[0]
                free_spins = cooldown[1]
                next_spin = last_spin + timedelta(minutes=10)
                
                if free_spins > 0:
                    cur.execute(
                        "UPDATE spin_cooldowns SET free_spins = free_spins - 1 WHERE user_id = %s",
                        (user_id,)
                    )
                elif now < next_spin:
                    seconds_left = int((next_spin - now).total_seconds())
                    return {
                        'statusCode': 429,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'error': 'Cooldown active',
                            'seconds_until_ready': seconds_left
                        }),
                        'isBase64Encoded': False
                    }
                else:
                    cur.execute(
                        "UPDATE spin_cooldowns SET last_spin_at = %s WHERE user_id = %s",
                        (now, user_id)
                    )
            else:
                cur.execute(
                    "INSERT INTO spin_cooldowns (user_id, last_spin_at) VALUES (%s, %s)",
                    (user_id, now)
                )
            
            cur.execute("""
                SELECT c.id, c.name, c.damage, c.image_url, r.name as rarity, r.color, r.drop_chance
                FROM characters c
                JOIN rarities r ON c.rarity_id = r.id
                WHERE (c.is_limited = FALSE) OR (c.is_limited = TRUE AND c.available_until > %s)
            """, (now,))
            
            characters = cur.fetchall()
            
            if not characters:
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'No characters available'}),
                    'isBase64Encoded': False
                }
            
            roll = random.uniform(0, 100)
            cumulative = 0
            selected_char = None
            
            for char in characters:
                drop_chance = float(char[6])
                cumulative += drop_chance
                if roll <= cumulative:
                    selected_char = char
                    break
            
            if not selected_char:
                selected_char = characters[0]
            
            cur.execute(
                "INSERT INTO user_characters (user_id, character_id) VALUES (%s, %s) RETURNING id",
                (user_id, selected_char[0])
            )
            user_char_id = cur.fetchone()[0]
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'user_character_id': user_char_id,
                    'character_id': selected_char[0],
                    'name': selected_char[1],
                    'damage': selected_char[2],
                    'image_url': selected_char[3],
                    'rarity': selected_char[4],
                    'rarity_color': selected_char[5]
                }),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    finally:
        cur.close()
        conn.close()
